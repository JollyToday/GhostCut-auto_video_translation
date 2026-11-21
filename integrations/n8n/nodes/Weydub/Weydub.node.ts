import {NodeConnectionTypes, NodeOperationError} from 'n8n-workflow';
import type {IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription} from 'n8n-workflow';
import contract from '../../contract.json';

const origin='https://api.zhaoli.com';
const operations=[
  ['Remove Burned-In Subtitles (Full-Frame Pro)','erase-pro'],
  ['Remove Burned-In Subtitles (Lite)','erase'],['Extract Full-Frame OCR Subtitles','ocr'],
  ['Translate and Dub Speech','dub'],['Translate Image Text','image'],
  ['Get Video or OCR Result','video-status'],['Get Image Result','image-status'],
];
const creation=['erase-pro','erase','ocr','dub','image'],lookups=['video-status','image-status'];
const show=(operation:string[])=>({show:{operation}});
const object=(v:unknown): v is Record<string,unknown>=>!!v && typeof v==='object' && !Array.isArray(v);
const text=(v:unknown)=>typeof v==='string' && v ? v : null;
function requestFor(op:string,input:string,source:string,target:string) {
  const pro=op==='erase-pro';
  if(!pro && !Object.hasOwn(contract,op))throw Error('Choose a supported operation.');
  const entry=pro?contract.erase:contract[op as keyof typeof contract];
  const body:IDataObject=pro?{
    needChineseOcclude:1, videoInpaintLang:'all',
    extraOptions:JSON.stringify({extra_inpaint_config:{model:'advanced_full'}}),
  }:structuredClone(entry.body);
  if(lookups.includes(op)) {
    if(!/^[1-9]\d*$/.test(input)||!Number.isSafeInteger(Number(input))) throw Error('Use a positive job ID from a creation response.');
    if(op==='video-status') body.idWorks=[String(input)];else body.id=Number(input);
  } else {
    let u;try{u=new URL(input);}catch{throw Error('Set a directly downloadable HTTPS media URL.');}
    if(u.protocol!=='https:'||u.username||u.password)throw Error('Set an HTTPS media URL without login credentials.');
    const language=/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/;
    if(!pro&&op!=='erase'&&!language.test(source))throw Error('Set the source language code.');
    if(['dub','image'].includes(op)&&!language.test(target))throw Error('Set the target language code.');
    if(op==='image')Object.assign(body,{downloadInfo:JSON.stringify({url:input}),srcLang:source,tgtLang:target});
    else body.urls=[input];
    if(op==='ocr')Object.assign(body,{lang:source,videoInpaintLang:source});
    if(op==='dub')Object.assign(body,{sourceLang:source,lang:target});
  }
  return {path:entry.path,body};
}
function result(op:string,input:string,r:unknown):IDataObject {
  if(!object(r))throw Error('No response object from Weydub. Check your task list before retrying.');
  if(r.code!==1000)throw Error(`Weydub code ${r.code}. ${r.code===4005?'Insufficient processing credits.':'Check the task list before retrying a submission.'}`);
  const b=object(r.body)?r.body:{};
  if(creation.includes(op)) {
    const first=Array.isArray(b.dataList)?b.dataList[0]:null;
    const id=op==='image'?r.body:object(first)?first.id:null;
    if(!/^[1-9]\d*$/.test(String(id))||!Number.isSafeInteger(Number(id)))throw Error('No job ID returned. Check your Weydub task list before retrying.');
    return {state:'accepted',jobId:String(id),nextOperation:op==='image'?'image-status':'video-status'};
  }
  if(op==='image-status'){
    if(typeof b.status!=='number')throw Error('Image job or status missing. Check the job ID and credential.');
    const out:unknown=typeof b.result==='string'&&b.result?JSON.parse(b.result):b.result;
    return {jobId:input,status:b.status,outputUrl:object(out)?text(out.output_url):null};
  }
  const item:unknown=Array.isArray(b.content)?b.content.find(row=>object(row)&&String(row.id)===input):null;
  if(!object(item)||typeof item.processStatus!=='number')throw Error('No matching video job for this credential.');
  return {jobId:input,status:item.processStatus,videoUrl:text(item.videoUrl),srtUrl:text(item.srcSrtUrl)||text(item.tgtSrtUrl),chargedCredits:typeof item.paidPoint==='number'?item.paidPoint:null};
}
export class Weydub implements INodeType {
  description:INodeTypeDescription={
    displayName:'Weydub Media',name:'weydub',icon:'file:weydub.svg',group:['transform'],version:1,
    subtitle:'={{$parameter["operation"]}}',description:'Remove, transcribe, dub or translate media with Weydub',
    defaults:{name:'Weydub Media'},inputs:[NodeConnectionTypes.Main],outputs:[NodeConnectionTypes.Main],usableAsTool:true,
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
  async execute(this:IExecuteFunctions):Promise<INodeExecutionData[][]>{
    const rows:INodeExecutionData[]=[],inputs=this.getInputData();
    for(let i=0;i<inputs.length;i++){
      try {
        const get=(k:string,fallback:string|boolean)=>this.getNodeParameter(k,i,fallback);
        const op=String(get('operation','ocr')),isCreate=creation.includes(op);
        const input=String(get(isCreate?'mediaUrl':'jobId','')).trim();
        const req=requestFor(op,input,String(get('source','zh')),String(get('target','en')));
        let value;
        if(isCreate&&get('submit',false)!==true) value={state:'preview',operation:op,...req};
        else {
          const body=JSON.stringify(req.body);
          let raw;
          try { raw=await this.helpers.httpRequestWithAuthentication.call(this,'weydubApi',{method:'POST',url:origin+req.path,body,headers:{'Content-Type':'application/json'},timeout:45000,disableFollowRedirect:true}); }
          catch {throw Error('Check your Weydub credential and existing jobs before retrying; no response was confirmed.');}
          value=result(op,input,typeof raw==='string'?JSON.parse(raw):raw);
        }
        rows.push({json:value,pairedItem:{item:i}});
      } catch(e){
        if(!this.continueOnFail() && inputs.length===1)throw new NodeOperationError(this.getNode(),e instanceof Error?e:'Unknown processing error',{itemIndex:i});
        rows.push({json:{state:'error',message:e instanceof Error?e.message:'Unknown processing error'},pairedItem:{item:i}});
      }
    }
    return [rows];
  }
}
