import {createHash, createHmac} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

const origin = 'https://api.weydub.com/marketplace-apify';
const actorId = 'Kf4p4M653a68biihw';
const resultField = {image:'imageUrl', ocr:'srtUrl', erase:'videoUrl', dub:'videoUrl'};
const mediaHosts = /^(?:gc\d+\.cdn\.izhaoli\.cn|[a-z0-9-]+\.oss-[a-z0-9-]+\.aliyuncs\.com|[a-z0-9-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com)$/;

export function assetUrl(input) {
  const u = new URL(input);
  if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash ||
      !(mediaHosts.test(u.hostname) || (u.hostname === 'api.apify.com' &&
        /^\/v2\/key-value-stores\/[a-zA-Z0-9]{17}\/records\/[^/]+$/.test(u.pathname) && !u.searchParams.has('token')))) {
    throw Error('Use a direct HTTPS Apify file link, S3 object, Alibaba OSS object, or Weydub library URL.');
  }
  return u;
}

async function bytes(url, limit) {
  const response = await fetch(assetUrl(url),{redirect:'error',signal:AbortSignal.timeout(45000)});
  if (!response.ok || Number(response.headers.get('content-length'))>limit) throw Error('Media is unavailable or too large.');
  const chunks=[]; let total=0;
  for await (const chunk of response.body) {
    total+=chunk.length;
    if(total>limit) throw Error('Media exceeds the file size limit.');
    chunks.push(chunk);
  }
  if(!total)throw Error('Empty media file.');
  return Buffer.concat(chunks);
}

export function signedHeaders(path,context,body,secret,now=Date.now()) {
  const time=String(Math.floor(now/1000)), meta=Buffer.from(JSON.stringify(context)).toString('base64url');
  const digest=createHash('sha256').update(body).digest('hex');
  return {'Content-Type':'application/octet-stream','X-Weydub-Time':time,'X-Weydub-Context':meta,
    'X-Weydub-Sha256':digest,'X-Weydub-Signature':createHmac('sha256',secret).update(['v1',path,time,meta,digest].join('\n')).digest('hex')};
}

function mimeOf(op,b) {
  if(op!=='image') return 'video/mp4';
  if(b.subarray(0,3).equals(Buffer.from([255,216,255])))return 'image/jpeg';
  if(b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return 'image/png';
  if(b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP')return 'image/webp';
  throw Error('Use one JPEG, PNG or WebP image.');
}

function resultType(op,data) {
  if(op==='ocr'){
    if(!/\d{2}:\d{2}:\d{2}[,.]\d{3} --> \d{2}:\d{2}:\d{2}[,.]\d{3}/.test(data.toString('utf8')))
      throw Error('The service returned no timed subtitle cues. No completed-media event was charged.');
    return 'application/x-subrip';
  }
  if(op==='image')return mimeOf(op,data);
  if(data.length<16 || data.toString('ascii',4,8)!=='ftyp')throw Error('No downloadable MP4 video was delivered.');
  return 'video/mp4';
}

export async function merchantJob(actor,input) {
  const env=process.env, secret=env.WEYDUB_APIFY_ORIGIN_SECRET;
  if(!secret || secret.length<40 || env.ACTOR_ID!==actorId || env.APIFY_USER_IS_PAYING!=='1')
    throw Error('Store billing is not available for this run. Use your own Weydub credentials instead.');
  const op=input.operation, key=input.requestKey;
  if(!Object.hasOwn(resultField,op) || !/^[a-zA-Z0-9_.:-]{1,100}$/.test(typeof key==='string'?key:''))
    throw Error('Choose one media operation and a stable request key for this file.');
  const row=await actor.apifyClient.run(env.ACTOR_RUN_ID).get();
  if(row?.id!==env.ACTOR_RUN_ID || row?.actId!==actorId || row.userId!==env.APIFY_USER_ID ||
      row.buildId!==env.ACTOR_BUILD_ID || row.status!=='RUNNING' || row.pricingInfo?.pricingModel!=='PAY_PER_EVENT')
    throw Error('No active Store-priced run could be verified.');
  const run=Object.fromEntries(['id','actId','buildId','userId','status','defaultDatasetId','chargedEventCounts','options','pricingInfo'].map(k=>[k,row[k]]));
  // Exclude input, user token, unrelated run options and storage URLs from the signed context.
  run.options={maxTotalChargeUsd:row.options?.maxTotalChargeUsd};
  async function broker(action,extra={},body=Buffer.alloc(0)){
    const path='/v1/apify/'+action, ctx={run,paying:true,operation:op,...extra};
    const response=await fetch(origin+path,{method:'POST',redirect:'error',headers:signedHeaders(path,ctx,body,secret),
      body,signal:AbortSignal.timeout(65000)});
    if(!response.ok){
      const msg=(await response.json().catch(()=>({}))).error;
      throw Error(`Weydub ${action}: ${typeof msg==='string'?msg.slice(0,150):'HTTP '+response.status}`);
    }
    return response.json();
  }
  const data=await bytes(input.input, (op==='image'?8:16)*1024*1024);
  const order=await broker('order',{key,mime:mimeOf(op,data),source:op!=='erase'?(input.source||'zh'):undefined,
    target:['dub','image'].includes(op)?(input.target||'en'):undefined},data);
  await actor.setValue('WEYDUB-ORDER',order);
  const job=order.jobId;
  for(;;){
      const result=await broker('status',{job});
      if(result.state==='failed')throw Error('Weydub could not process this file. No completed-media event was charged.');
      if(result.state==='ready'){
        const resultUrl=result[resultField[op]];
        const delivered=await bytes(resultUrl,op==='ocr'?1024*1024:64*1024*1024);
        const type=resultType(op,delivered);
        await actor.setValue('MEDIA',delivered,{contentType:type});
        // Keep the buyer's result in the run as well as the dataset, before any charge.
        const output={jobId:job,operation:op,contentType:type,bytes:delivered.length,recordKey:'MEDIA',url:resultUrl};
        const dataset=await actor.openDataset();
        const existing=(await dataset.getData({limit:1})).items[0];
        if(!existing || existing.jobId!==job || existing.url!==resultUrl)await actor.pushData(output);
        await actor.setValue('WEYDUB-DELIVERY',output);
        break;
      }
      await delay(8000);
  }
  const ticket=await broker('claim',{job,dataset:run.defaultDatasetId});
  if(!ticket.mayCharge){
    if(['reported','reconciled'].includes(ticket.state) && ticket.charged===ticket.count)return;
    throw Error('Media is available. The original charge needs reconciliation; do not submit again.');
  }
  const charge=await actor.charge({eventName:ticket.eventName,count:ticket.count,idempotencyKey:ticket.key});
  await broker('report',{job,charged:charge.chargedCount});
  await actor.setValue('WEYDUB-BILLING',{charged:charge.chargedCount,expected:ticket.count});
  if(charge.chargedCount!==ticket.count)throw Error('Media is available. A partial platform charge needs reconciliation.');
}
