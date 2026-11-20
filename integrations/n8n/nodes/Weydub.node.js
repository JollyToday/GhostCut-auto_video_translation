'use strict';
const contract=require('../contract.json');
const origin='https://api.zhaoli.com';
const operations=[
  ['Remove Burned-In Subtitles (Lite)','erase'],['Extract Full-Frame OCR Subtitles','ocr'],
  ['Translate and Dub Speech','dub'],['Translate Image Text','image'],
  ['Get Video or OCR Result','video-status'],['Get Image Result','image-status'],
];
const creation=['erase','ocr','dub','image'],lookups=['video-status','image-status'];
const show=operation=>({show:{operation}});
function requestFor(op,input,source,target) {
  if(!Object.hasOwn(contract,op))throw Error('Choose a supported operation.');
  const entry=contract[op], body=structuredClone(entry.body);
  if(lookups.includes(op)) {
    if(!/^[1-9]\d*$/.test(input)||!Number.isSafeInteger(Number(input))) throw Error('Use a positive job ID from a creation response.');
    if(op==='video-status') body.idWorks=[String(input)];else body.id=Number(input);
  } else {
    let u;try{u=new URL(input);}catch{throw Error('Set a directly downloadable HTTPS media URL.');}
    if(u.protocol!=='https:'||u.username||u.password)throw Error('Set an HTTPS media URL without login credentials.');
    const language=/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/;
    if(op!=='erase'&&!language.test(source))throw Error('Set the source language code.');
    if(['dub','image'].includes(op)&&!language.test(target))throw Error('Set the target language code.');
    if(op==='image')Object.assign(body,{downloadInfo:JSON.stringify({url:input}),srcLang:source,tgtLang:target});
    else body.urls=[input];
    if(op==='ocr')Object.assign(body,{lang:source,videoInpaintLang:source});
    if(op==='dub')Object.assign(body,{sourceLang:source,lang:target});
  }
  return {path:entry.path,body};
}
function result(op,input,r) {
  if(r.code!==1000)throw Error(`Weydub code ${r.code}. ${r.code===4005?'Insufficient processing credits.':'Check the task list before retrying a submission.'}`);
  if(creation.includes(op)) {
    const id=op==='image'?r.body:r.body?.dataList?.[0]?.id;
    if(!id)throw Error('No job ID returned. Check your Weydub task list before retrying.');
    return {state:'accepted',jobId:String(id),nextOperation:op==='image'?'image-status':'video-status'};
  }
  if(op==='image-status'){
    const b=r.body;
    if(typeof b?.status!=='number')throw Error('Image job or status missing. Check the job ID and credential.');
    const out=typeof b.result==='string'&&b.result?JSON.parse(b.result):b.result;
    return {jobId:input,status:b.status,outputUrl:out?.output_url||null};
  }
  const item=r.body?.content?.find(row=>String(row.id)===input);
  if(!item)throw Error('No matching video job for this credential.');
  return {jobId:input,status:item.processStatus,videoUrl:item.videoUrl||null,srtUrl:item.srcSrtUrl||item.tgtSrtUrl||null,chargedCredits:item.paidPoint??null};
}
class Weydub {
  description={
    displayName:'Weydub Media',name:'weydub',icon:'file:weydub.svg',group:['transform'],version:1,
    subtitle:'={{$parameter["operation"]}}',description:'Remove, transcribe, dub or translate media with Weydub',
    defaults:{name:'Weydub Media'},inputs:['main'],outputs:['main'],
    credentials:[{name:'weydubApi',required:false}],
    properties:[
      {displayName:'Operation',name:'operation',type:'options',noDataExpression:true,default:'ocr',options:operations.map(([name,value])=>({name,value,action:name}))},
      {displayName:'Media URL',name:'mediaUrl',type:'string',default:'',required:true,displayOptions:show(creation),description:'A downloadable HTTPS URL. Use a clip with visible captions for OCR.'},
      {displayName:'Source Language',name:'source',type:'string',default:'zh',required:true,displayOptions:show(['ocr','dub','image']),description:'Language of on-screen text for OCR or images; spoken language for dubbing'},
      {displayName:'Target Language',name:'target',type:'string',default:'en',required:true,displayOptions:show(['dub','image'])},
      {displayName:'Submit Billable Job',name:'submit',type:'boolean',default:false,displayOptions:show(creation),description:'Whether to send one processing job per input item. Leave off to preview without credentials or credits.'},
      {displayName:'Job ID',name:'jobId',type:'string',default:'',required:true,displayOptions:show(lookups),description:'Use the jobId returned when the file was submitted'},
    ],
  };
  async execute(){
    const rows=[],inputs=this.getInputData();
    for(let i=0;i<inputs.length;i++){
      try {
        const get=(k,fallback)=>this.getNodeParameter(k,i,fallback);
        const op=get('operation','ocr'),isCreate=creation.includes(op);
        const input=String(get(isCreate?'mediaUrl':'jobId','')).trim();
        const req=requestFor(op,input,get('source','zh'),get('target','en'));
        let value;
        if(isCreate&&!get('submit',false)) value={state:'preview',operation:op,...req};
        else {
          const body=JSON.stringify(req.body);
          let raw;
          try { raw=await this.helpers.httpRequestWithAuthentication.call(this,'weydubApi',{method:'POST',url:origin+req.path,body,headers:{'Content-Type':'application/json'},timeout:45000,disableFollowRedirect:true}); }
          catch {throw Error('Check your Weydub credential and existing jobs before retrying; no response was confirmed.');}
          value=result(op,input,typeof raw==='string'?JSON.parse(raw):raw);
        }
        rows.push({json:value,pairedItem:{item:i}});
      } catch(e){
        if(!this.continueOnFail() && inputs.length===1)throw e;
        rows.push({json:{state:'error',message:e.message},pairedItem:{item:i}});
      }
    }
    return [rows];
  }
}
module.exports={Weydub};
