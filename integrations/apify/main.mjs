import {Actor} from 'apify';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {merchantJob} from './merchant.mjs';

const run=promisify(execFile);
const operations=new Set(['erase','ocr','dub','image','video-status','image-status']);
await Actor.main(async()=>{
  const settings=await Actor.getInput()??{};
  const {operation,input,source='zh',target='en',submit=false,appKey,appSecret,billing='own'}=settings;
  if(!operations.has(operation)||typeof input!=='string'||!input.trim())throw Error('Choose an operation and provide a media URL or job ID.');
  const status=operation.endsWith('-status');
  if(billing==='store'){
    if(appKey||appSecret||status)throw Error('For Store billing, leave the Weydub key fields empty and choose a processing operation.');
    if(submit){await merchantJob(Actor,settings);return;}
  }else if(billing!=='own')throw Error('Unknown billing method.');
  if((submit||status)&&(!appKey||!appSecret))throw Error('Enter your own Weydub AppKey and AppSecret for this operation.');
  const args=[fileURLToPath(new URL('./examples/media.mjs',import.meta.url)),operation,input.trim(),'--source',source,'--target',target];
  if(submit&&!status)args.push('--submit');
  let stdout;
  try{
    ({stdout}=await run(process.execPath,args,{env:{WEYDUB_APP_KEY:appKey||'',WEYDUB_APP_SECRET:appSecret||''},timeout:55000,maxBuffer:1024*1024}));
  }catch(error){
    const reason=error.stderr?.match(/Gateway (?:returned HTTP|business code) \d+/)?.[0];
    throw Error((reason?reason+'. ':'')+(status?'Check the job type, number and credentials.':'Check the media URL and account. If you submitted, check your Weydub job history before retrying.'));
  }
  if(status){await Actor.pushData({operation,...JSON.parse(stdout)});return;}
  if(!submit){await Actor.pushData({operation,preview:true,request:stdout.trim()});return;}
  const id=stdout.match(/^Job (\d+)\n/)?.[1];
  if(!id)throw Error('Check Weydub job history before retrying: no job ID could be read.');
  await Actor.pushData({operation,jobId:id,nextOperation:operation==='image'?'image-status':'video-status'});
});
