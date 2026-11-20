#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';

const actions = ['erase','ocr','dub','image','video-status','image-status'];
const usage = 'node examples/media.mjs <erase|ocr|dub|image|video-status|image-status> <HTTPS media URL or job ID> [--source zh] [--target en] [--submit]';
const {values,positionals} = parseArgs({allowPositionals:true, options:{
  source:{type:'string',default:'zh'},target:{type:'string',default:'en'},submit:{type:'boolean'},help:{type:'boolean'},
}});
if (values.help || !positionals.length) { console.log(usage); process.exit(0); }
const [action,input] = positionals;
const index = actions.indexOf(action);
if (index < 0 || !input || positionals.length!==2) throw Error(usage);
const collection = JSON.parse(await readFile(new URL('./Weydub.postman_collection.json',import.meta.url)));
const request = collection.item[index].request;
const url = new URL(request.url);
if(url.origin!=='https://api.zhaoli.com') throw Error('Unexpected API origin');
const isStatus = action.endsWith('-status');
if (isStatus ? !/^[1-9]\d*$/.test(input)||!Number.isSafeInteger(Number(input)) : new URL(input).protocol!=='https:') throw Error('Expected '+(isStatus?'a positive job ID':'an HTTPS media URL'));
const vars = {video_url:input,image_url:input,image_job_id:input,video_work_id:input,source_language:values.source,target_language:values.target};
const payload=JSON.parse(request.body.raw.replace(/\{\{(\w+)\}\}/g,(_,key)=>JSON.stringify(vars[key]).slice(1,-1)));
// The upstream image endpoint expects its downloadInfo as a JSON string.
if(action==='image')payload.downloadInfo=JSON.stringify({url:input});
const body=JSON.stringify(payload);
if (!isStatus && !values.submit) {
  console.log(`Preview: ${request.method} ${url.pathname}\n${JSON.stringify(payload,null,2)}\nAdd --submit to create one billable job.`);
  process.exit(0);
}
const key=process.env.WEYDUB_APP_KEY, secret=process.env.WEYDUB_APP_SECRET;
if(!key||!secret) throw Error('Set WEYDUB_APP_KEY and WEYDUB_APP_SECRET in your local environment.');
const md5=text=>createHash('md5').update(text).digest('hex');
const response=await fetch(url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',AppKey:key,AppSign:md5(md5(body)+secret)},body,signal:AbortSignal.timeout(45000)});
if(!response.ok)throw Error(`Gateway returned HTTP ${response.status}.`);
const r=await response.json();
if(r.code!==1000)throw Error(`Gateway business code ${r.code}. Check your job list before retrying a creation request.`);
if(!isStatus) {
  const id=action==='image'?r.body:r.body.dataList?.[0]?.id;
  if(!/^[1-9]\d*$/.test(String(id))||!Number.isSafeInteger(Number(id)))throw Error('No valid job ID returned. Check your job list before retrying.');
  console.log(`Job ${id}\nnode examples/media.mjs ${action==='image'?'image':'video'}-status ${id}`);
}else if(action==='image-status') {
  if(String(r.body?.id)!==input || !Number.isInteger(r.body?.status))throw Error('No matching image job for these credentials. Check the job type and ID.');
  const raw=r.body.status===1?r.body.result:null;
  const result=typeof raw==='string'&&raw?JSON.parse(raw):raw;
  console.log(JSON.stringify({status:r.body.status,output:result?.output_url},null,2));
}else{
  const item=r.body.content.find(x=>String(x.id)===input);
  if(!item)throw Error('Job not found for these credentials.');
  const ready=item.processStatus===1;
  console.log(JSON.stringify({id:item.id,status:item.processStatus,video:ready?item.videoUrl:undefined,sourceSubtitles:ready?item.srcSrtUrl:undefined,targetSubtitles:ready?item.tgtSrtUrl:undefined,chargedCredits:item.paidPoint},null,2));
}
