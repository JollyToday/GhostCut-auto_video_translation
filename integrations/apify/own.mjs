import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

const receiptKey='WEYDUB-SUBMISSION';
const uncertain='Check your Weydub job history before submitting again. The earlier request may already have used credits.';

export function statusRow(operation,id,result){
  const image=operation==='image-status', code=result.status;
  const row={operation,jobId:id,status:code,...(!image && result.id!=null?{id:result.id}:{}),
    ...(result.chargedCredits!=null?{chargedCredits:result.chargedCredits}:{})};
  if(!Number.isInteger(code))return {...row,state:'unknown',nextAction:'Check this job in Weydub using its ID.'};
  if(code<1)return {...row,state:'processing',nextOperation:operation,nextAction:'Wait, then check the same job ID. Do not submit the file again.'};
  if(code!==1)return {...row,state:'failed',nextAction:!image&&code===83
    ?'Check your Weydub credit balance to unlock this job. Do not create another job.'
    :!image&&code===73?'Processing did not start. Check the credits on the connected Weydub account and keep this job ID.'
    :'Check this job in Weydub for its error details before submitting another file.'};
  const files=(image?['output']:['video','sourceSubtitles','targetSubtitles']).filter(k=>{
    try{return ['https:','http:'].includes(new URL(result[k]).protocol);}catch{return false;}
  });
  return files.length?{...row,...Object.fromEntries(files.map(k=>[k,result[k]])),state:'ready',files,nextAction:'Open a result link to download the file.'}
    :{...row,state:'missing-output',nextAction:'The job finished without a download link. Contact Weydub with this job ID.'};
}

export async function ownJob(actor,settings,send,wait=delay){
  const {operation,input,source='zh',target='en',submit=false,appKey,appSecret}=settings;
  const status=operation.endsWith('-status');
  if((submit||status)&&(!appKey||!appSecret))throw Error('Enter your own Weydub AppKey and AppSecret for this operation.');
  if(status)return actor.pushData(statusRow(operation,input.trim(),JSON.parse(await send(operation,input.trim()))));
  if(!submit)return actor.pushData({operation,preview:true,request:(await send(operation,input.trim())).trim()});
  const key=createHash('sha256').update(JSON.stringify([operation,input.trim(),source,target,appKey])).digest('hex');
  let receipt=await actor.getValue(receiptKey);
  if(receipt){
    if(receipt.key!==key)throw Error('This run belongs to a different submission. Open the original run.');
    if(receipt.state!=='accepted'||!/^[1-9]\d*$/.test(receipt.jobId))throw Error(uncertain);
  }else{
    // A restart between sending the request and saving its ID must never send a second billable request.
    await actor.setValue(receiptKey,{key,state:'submitting'});
    const stdout=await send(operation,input.trim());
    const id=stdout.match(/^Job ([1-9]\d*)\n/)?.[1];
    if(!id)throw Error(uncertain);
    receipt={key,state:'accepted',jobId:id};
    await actor.setValue(receiptKey,receipt);
  }
  const first=(await (await actor.openDataset()).getData({limit:1})).items[0];
  if(first){
    if(first.jobId!==receipt.jobId || first.operation!==operation)throw Error('The dataset does not match the saved submission. Check WEYDUB-SUBMISSION for your job ID.');
    return;
  }
  const nextOperation=operation==='image'?'image-status':'video-status';
  let row={state:'submitted',nextAction:'Use the status operation with this job ID and the same Weydub account.'};
  if(settings.waitForResult===true){
    const deadline=Date.now()+150000;
    for(let i=0;i<16;i++){
      try{
        row=statusRow(nextOperation,receipt.jobId,JSON.parse(await send(nextOperation,receipt.jobId)));
      }catch{
        row={state:'submitted',nextAction:'The job was accepted but the status check was unavailable. Use the status operation with this job ID. Do not submit again.'};
        break;
      }
      if(row.state!=='processing'||i===15||Date.now()+10000>=deadline)break;
      await wait(10000);
    }
    const expected={image:'output',ocr:'sourceSubtitles',erase:'video',dub:'video'}[operation];
    if(row.state==='ready'&&!row.files.includes(expected))
      row={state:'missing-output',status:row.status,nextAction:'The requested file was not delivered. Keep this job ID and contact Weydub.'};
  }
  await actor.pushData({...row,operation,jobId:receipt.jobId,nextOperation});
}
