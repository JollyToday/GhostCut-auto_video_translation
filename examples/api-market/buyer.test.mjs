import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {run} from './buyer.mjs';

const base='https://prod.api.market/api/v1/weydub/pro-subtitle-removal';
const token='a'.repeat(64)+'.'+'b'.repeat(64);
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
    if (path==='/delivery') return Response.json({state:'ready',videoUrl:'https://media.example/test.mp4'});
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

test('distinguish marked origin errors from generic marketplace rejection; never log the response',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'market-refused-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  for (const [code,expect] of [['receipt_access',/origin rejected receipt access/],['arbitrary',/HTTP 403\. Check the subscription/]]) {
    await assert.rejects(run(['receipt',join(dir,'receipt')],{key:'example',send:async()=>
      Response.json({code,error:'private secret'},{status:403})}),e=>expect.test(e.message)&&!e.message.includes('private secret'));
  }
});
