// Build the importable n8n workflow using only built-in nodes.
import {writeFile} from 'node:fs/promises';

const actions=['Create a private receipt','Upload my authorized MP4','Check my result'];
const endpoint='https://api.weydub.com/agent-trial/v1/removal';
const node=(n,name,type,typeVersion,x,y,parameters)=>({id:`982d91c1-d24e-41aa-afb5-${String(n).padStart(12,'0')}`,
  name,type:'n8n-nodes-base.'+type,typeVersion,position:[x,y],parameters});
function validate() {
  const {action,receipt=''}=$json;
  const key=String(receipt??'').trim();
  const file=$binary?.clip;
  const stop=message=>({json:{route:3,title:'Check your form',message}});
  if(action==='Create a private receipt' && !file && !key)return {json:{route:0}};
  if(action==='Create a private receipt')return stop('Leave the receipt and file empty to create a receipt. To resume, choose Check my result.');
  if(!/^[a-f0-9]{64}$/.test(key))return stop('Paste the complete 64-character receipt. Create one first if you are starting a new clip.');
  if(action==='Check my result' && !file)return {json:{route:2,receipt:key}};
  if(action==='Check my result')return stop('Remove the selected file to check your result. Nothing was sent to Weydub.');
  if(action!=='Upload my authorized MP4' || !file)return stop('Select the upload action and choose one H.264 MP4 that you may send to Weydub.');
  if(!/\.mp4$/i.test(file.fileName??''))return stop('Choose an MP4 file. Nothing was sent to Weydub.');
  return {json:{route:1,receipt:key},binary:{clip:file}};
}
function describe() {
  const code=$json.statusCode, data=$json.body??{};
  const show=(title,message)=>({json:{title,message,ready:false}});
  if(code===429)return show('Trial capacity unavailable','No paid job was started. Keep your receipt and try again later.');
  if(code===404)return show('No clip on this receipt','Check the receipt you pasted. If you have not submitted the clip, use Upload my authorized MP4.');
  if(code===409)return show('This receipt belongs to another clip','Check the original receipt. Use a new one only for a different video.');
  if([413,415,422].includes(code))return show('Check your video','Use an H.264 MP4 of up to 60 seconds and 16 MiB, with AAC audio or no audio.');
  if(![200,202].includes(code))return show('Request not confirmed','Keep the same receipt and check your result before retrying.');
  if(data.state==='ready' && data.videoUrl) {
    if(/^https:\/\/[a-z0-9.-]+\/[^\s\\<>"]+$/i.test(data.videoUrl))return {json:{ready:true,url:data.videoUrl}};
    return show('Download unavailable','Keep your receipt and check again later.');
  }
  if(['queued','submitting','processing','ready'].includes(data.state))return show(
    data.replayed?'This clip was already submitted':(data.state==='ready'?'Your clip is ready':'Your clip is being processed'),
    'Open the form again, select Check my result and use the same receipt. Leave the file field empty.');
  return show('This result is unavailable','Keep your receipt. Processing may have failed or the download may have expired.');
}
const fn=f=>({mode:'runOnceForEachItem',jsCode:f.toString().slice(f.toString().indexOf('{')+1,-1)});
const switcher=(n,output)=>({mode:'expression',numberOutputs:n,output});
const http=method=>({url:endpoint,method,sendHeaders:true,
  headerParameters:{parameters:[{name:'X-Trial-Receipt',value:'={{ $json.receipt }}'},
    ...(method==='POST'?[{name:'Content-Type',value:'video/mp4'}]:[])]},
  ...(method==='POST'?{sendBody:true,contentType:'binaryData',inputDataFieldName:'clip'}:{}),
  options:{timeout:90000,redirect:{redirect:{followRedirects:false}},response:{response:{fullResponse:true,neverError:true,responseFormat:'json'}}}});
const nodes=[
  {...node(1,'Try subtitle removal','formTrigger',2.4,0,180,{
    authentication:'basicAuth',formTitle:'Remove burned-in subtitles',
    formDescription:'Use an H.264 MP4 you may share, up to 60 seconds and 16 MiB. Pro scans the whole picture, including signs and prices. First create and save a private receipt. Only the upload action sends your clip to Weydub.',
    formFields:{values:[
      {fieldName:'action',fieldLabel:'Action',fieldType:'dropdown',fieldOptions:{values:actions.map(option=>({option}))},requiredField:true},
      {fieldName:'receipt',fieldLabel:'Private receipt',fieldType:'password'},
      {fieldName:'clip',fieldLabel:'Your MP4 (upload only)',fieldType:'file',multipleFiles:false,acceptFileTypes:'.mp4'}]},
    responseMode:'lastNode',options:{buttonLabel:'Continue',appendAttribution:false}
  }),webhookId:'15475c47-42a0-48d7-a931-f43f35f48900'},
  node(2,'Check the form','code',2,230,180,fn(validate)),
  node(3,'Choose action','switch',3.2,460,180,switcher(4,'={{ $json.route }}')),
  node(4,'Generate receipt locally','crypto',1,710,-180,{action:'generate',encodingType:'hex',stringLength:64,dataPropertyName:'receipt'}),
  node(5,'Save your receipt','form',1,960,-180,{operation:'completion',respondWith:'text',completionTitle:'Save your private receipt',completionMessage:'={{ "Copy this receipt before uploading: " + $json.receipt + ". Open the form again and choose Upload my authorized MP4. Anyone with the receipt can retrieve the result." }}'}),
  {...node(6,'Upload authorized clip','httpRequest',4.2,710,40,http('POST')),onError:'continueRegularOutput'},
  {...node(7,'Check saved receipt','httpRequest',4.2,710,230,http('GET')),onError:'continueRegularOutput'},
  node(8,'Read processing status','code',2,960,120,fn(describe)),
  node(9,'Ready to download?','switch',3.2,1190,120,switcher(2,'={{ $json.ready ? 0 : 1 }}')),
  node(10,'Open cleaned MP4','form',1,1430,40,{operation:'completion',respondWith:'redirect',redirectUrl:'={{ $json.url }}'}),
  node(11,'Show next step','form',1,1430,310,{operation:'completion',respondWith:'text',completionTitle:'={{ $json.title }}',completionMessage:'={{ $json.message }}'})
];
const routes={1:[2],2:[3],3:[4,6,7,11],4:[5],6:[8],7:[8],8:[9],9:[10,11]};
const connections=Object.fromEntries(Object.entries(routes).map(([from,outputs])=>[nodes[from-1].name,
  {main:outputs.map(to=>[{node:nodes[to-1].name,type:'main',index:0}])}]));
const flow={name:'Weydub: try full-frame Pro subtitle removal',id:'WeydubSponsoredPro',active:false,nodes,connections,
  settings:{executionOrder:'v1',saveManualExecutions:false,saveDataErrorExecution:'none',saveDataSuccessExecution:'none'},pinData:{}};
await writeFile(new URL('free-pro-subtitle-removal.json',import.meta.url),JSON.stringify(flow,null,2)+'\n');
