import assert from 'node:assert/strict';
import test from 'node:test';
import {createHmac,createHash} from 'node:crypto';
import {merchantJob} from './merchant.mjs';

test('Store run persists a deliverable before charging and does not recharge on resume', async t=>{
  const env={ACTOR_ID:'Kf4p4M653a68biihw',ACTOR_RUN_ID:'A'.repeat(17),APIFY_USER_ID:'U'.repeat(17),
    ACTOR_BUILD_ID:'B'.repeat(17),APIFY_USER_IS_PAYING:'1',WEYDUB_APIFY_ORIGIN_SECRET:'x'.repeat(64)};
  const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]])); Object.assign(process.env,env);
  t.after(()=>{for(const [k,v] of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;});
  const run={id:env.ACTOR_RUN_ID,userId:env.APIFY_USER_ID,buildId:env.ACTOR_BUILD_ID,actId:env.ACTOR_ID,
    status:'RUNNING',defaultDatasetId:'D'.repeat(17),chargedEventCounts:{},options:{maxTotalChargeUsd:0.01},
    pricingInfo:{pricingModel:'PAY_PER_EVENT'}};
  const media='https://gc100.cdn.izhaoli.cn/example.webp', result='https://gc9.cdn.izhaoli.cn/example.jpg';
  const job='2'.repeat(32),record=new Map(),dataset=[],calls=[];
  let charged=0,claimed=false,failDownload=true,loseReport=true,sourceReads=0;
  t.mock.method(globalThis,'fetch',async (url,options)=>{
    if(String(url)===media)return ++sourceReads===1?new Response(Buffer.from('RIFF0000WEBP')):new Response('',{status:403});
    if(String(url)===result)return failDownload?new Response('',{status:503}):new Response(Buffer.from([255,216,255,217]));
    const u=new URL(url), path=u.pathname.replace('/marketplace-apify',''), h=options.headers;
    assert.equal(u.origin,'https://api.weydub.com');
    const digest=createHash('sha256').update(options.body).digest('hex');
    assert.equal(h['X-Weydub-Signature'],createHmac('sha256',env.WEYDUB_APIFY_ORIGIN_SECRET)
      .update(['v1',path,h['X-Weydub-Time'],h['X-Weydub-Context'],digest].join('\n')).digest('hex'));
    const ctx=JSON.parse(Buffer.from(h['X-Weydub-Context'],'base64url'));assert.equal(ctx.run.id,run.id);
    calls.push(path);
    if(path.endsWith('/order'))return Response.json({jobId:job,eventName:'image-zh-en',count:1});
    if(path.endsWith('/status'))return Response.json({state:'ready',imageUrl:result});
    if(path.endsWith('/claim')){
      assert.ok(record.has('MEDIA') && dataset.length===1);
      if(claimed)return Response.json({mayCharge:false,state:'claimed'});
      claimed=true;return Response.json({mayCharge:true,eventName:'image-zh-en',count:1,key:'wd-'+job});
    }
    if(path.endsWith('/report') && loseReport)return new Response('',{status:503});
    throw Error('Unexpected request');
  });
  const actor={apifyClient:{run:()=>({get:async()=>run})},openDataset:async()=>({getData:async()=>({items:dataset})}),
    pushData:async r=>dataset.push(r),setValue:async(k,v)=>record.set(k,v),getValue:async k=>record.get(k),charge:async args=>{
      assert.equal(args.idempotencyKey,'wd-'+job);charged++;return {chargedCount:1};
    }};
  const input={operation:'image',requestKey:'photo-1',input:media};
  await assert.rejects(merchantJob(actor,input),/unavailable/);
  assert.equal(charged,0);assert.ok(!calls.includes('/v1/apify/claim'));
  const before=calls.length;
  await assert.rejects(merchantJob(actor,{...input,target:'fr'}),/does not match/);
  assert.equal(calls.length,before);
  failDownload=false;
  await assert.rejects(merchantJob(actor,input),/report/);
  assert.equal(charged,1);
  await assert.rejects(merchantJob(actor,input),/reconciliation/);
  assert.equal(charged,1);assert.equal(dataset.length,1);
  assert.equal(sourceReads,1);assert.equal(calls.filter(path=>path.endsWith('/order')).length,1);
  process.env.APIFY_USER_IS_PAYING='0';
  await assert.rejects(merchantJob(actor,input),/billing is not available/);
});
