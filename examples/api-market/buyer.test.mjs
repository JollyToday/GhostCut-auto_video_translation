import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {run} from './buyer.mjs';

const base='https://prod.api.market/api/v1/weydub/pro-subtitle-removal';
const token='a'.repeat(64)+'.'+'b'.repeat(64);
test('usage checks only this subscription; missing, expired and unrelated responses cannot look like a successful lookup',async()=>{
  const endpoint='https://prod.api.market/api/v1/user/usage/weydub/pro-subtitle-removal/';
  const snapshot={apiName:'weydub/pro-subtitle-removal',apiCallsLeft:0,apiCallsMade:1,startDate:'2026-11-01T00:00:00Z'};
  const check=(status,body)=>run(['usage'],{key:'qa-key',send:async(url,opts)=>{
    assert.equal(url,endpoint);assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
    assert.equal(opts.headers['x-api-market-key'],'qa-key');assert.equal(opts.body,undefined);
    return Response.json(body,{status});
  }});
  assert.match(await check(200,snapshot),/used 1, remaining 0/);
  await assert.rejects(check(401,{}),/did not accept/);
  await assert.rejects(check(404,{}),/no subscription/);
  await assert.rejects(check(200,{...snapshot,apiName:'other/product'}),/recognizable counters/);
});
test('a single receipt survives every step; only an explicit ready claim reaches delivery',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'market-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const receipt=join(dir,'receipt'), out=join(dir,'out.mp4'), calls=[];
  const bytes=await readFile(new URL('practice-6s.mp4',import.meta.url));
  let state='processing', validMedia=true;
  const go=(...args)=>run(args,{key:'subscriber-fixture',send:async(url,opts)=>{
    assert.equal(opts.redirect,'error');
    if (url instanceof URL) {
      assert.equal(opts.headers,undefined);
      return new Response(validMedia?bytes:'error page',{headers:{'content-type':'application/octet-stream'}});
    }
    assert.ok(url.startsWith(base+'/')); assert.equal(opts.headers['x-api-market-key'],'subscriber-fixture');
    const path=url.slice(base.length);
    calls.push([opts.method,path]);
    if (path==='/receipts') return Response.json({receipt:token});
    assert.equal(opts.headers['X-Removal-Receipt'],token);
    if (path==='/delivery') return Response.json({state:'ready',videoUrl:'https://gc70.cdn.izhaoli.cn/test.mp4'});
    if (opts.method==='POST') {
      assert.deepEqual(opts.body,bytes); assert.equal(opts.headers['Content-Type'],'video/mp4');
    }
    return Response.json({state});
  }});
  assert.ok(!(await go('receipt',receipt)).includes(token));
  assert.equal((await stat(receipt)).mode & 0o777,0o600);
  await assert.rejects(go('receipt',receipt),{code:'EEXIST'});
  await go('upload',receipt,new URL('practice-6s.mp4',import.meta.url));
  await go('status',receipt);
  await assert.rejects(go('claim',receipt,out),/confirm-claim/);
  await go('claim',receipt,out,'--confirm-claim');
  assert.deepEqual(calls,[['POST','/receipts'],['POST','/removal'],['GET','/removal'],['GET','/removal']]);
  state='ready';
  await writeFile(out,'existing');
  await assert.rejects(go('claim',receipt,out,'--confirm-claim'),{code:'EEXIST'});
  assert.equal(await readFile(out,'utf8'),'existing');
  assert.equal(calls.at(-1)[1],'/removal');
  const second=join(dir,'clean.mp4');
  validMedia=false;
  await assert.rejects(go('claim',receipt,second,'--confirm-claim'),/not an MP4/);
  await assert.rejects(stat(second),{code:'ENOENT'});
  validMedia=true;
  await go('claim',receipt,second,'--confirm-claim');
  assert.deepEqual(await readFile(second),bytes);
  assert.equal(await readFile(receipt,'utf8'),token+'\n');
});

test('one-unit buyer can retry an interrupted CDN download without another claim or subscriber key',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'market-one-unit-')); t.after(()=>rm(dir,{recursive:true,force:true}));
  const receipt=join(dir,'receipt'), link=join(dir,'private-link'), out=join(dir,'clean.mp4');
  await writeFile(receipt,token,{mode:0o600});
  const url='https://gc70.cdn.izhaoli.cn/qa.mp4?sig=private-fixture';
  const calls=[];
  const buyer={key:'fixture',send:async (u,opts)=>{
    calls.push([opts.method,u]);
    return Response.json(u===base+'/delivery'?{state:'ready',videoUrl:url}:{state:'ready'});
  }};
  assert.ok(!(await run(['claim-link',receipt,link,'--confirm-claim'],buyer)).includes('private-fixture'));
  assert.deepEqual(calls,[['GET',base+'/removal'],['POST',base+'/delivery']]);
  assert.equal((await stat(link)).mode & 0o777,0o600);
  await assert.rejects(run(['claim-link',receipt,link,'--confirm-claim'],buyer),{code:'EEXIST'});
  assert.equal(calls.filter(([m])=>m==='POST').length,1);
  const bytes=await readFile(new URL('./pro-6s.mp4',import.meta.url));
  let interrupted=true;
  const cdn={key:'',send:async(u,opts)=>{
    assert.equal(u.href,url);assert.equal(opts.headers,undefined);assert.equal(opts.redirect,'error');
    return new Response(interrupted?bytes.subarray(0,100):bytes,{status:interrupted?206:200,headers:{'content-type':'video/mp4'}});
  }};
  await assert.rejects(run(['download',link,out],cdn),/complete MP4/);
  await assert.rejects(stat(out),{code:'ENOENT'});
  interrupted=false;await run(['download',link,out],cdn);
  assert.deepEqual(await readFile(out),bytes);
  await writeFile(link,'https://unknown.example/qa.mp4');
  await assert.rejects(run(['download',link,join(dir,'new.mp4')],{send:()=>assert.fail('unexpected fetch')}),/Unrecognized result/);
});

test('distinguish marked origin errors from generic marketplace rejection; never log the response',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'market-refused-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await assert.rejects(run(['receipt',join(dir,'receipt')],{key:'example',send:async()=>
    Response.json({error:{message:'No active Subscription'}},{status:400})}),/Check the subscribed buyer account/);
  await assert.rejects(stat(join(dir,'receipt')),{code:'ENOENT'});
  for (const [code,expect] of [['receipt_access',/origin rejected receipt access/],['arbitrary',/HTTP 403\. Check the subscription/]]) {
    await assert.rejects(run(['receipt',join(dir,'receipt')],{key:'example',send:async()=>
      Response.json({code,error:'private secret'},{status:403})}),e=>expect.test(e.message)&&!e.message.includes('private secret'));
  }
});
