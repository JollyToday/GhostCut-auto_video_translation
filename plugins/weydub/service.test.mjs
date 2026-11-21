import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {preview,service} from './service.mjs';

const sample='https://example.org/sample.mp4?signature=private';
test('preview exposes only a hostname, and an unconfirmed submit makes no request',async()=>{
  let calls=0;
  const api=service({request:()=>{calls++;}});
  assert.deepEqual(preview(sample),{state:'preview',source_host:'example.org',model:'Pro',region:'full frame',billable:false});
  assert.throws(()=>preview('https://user:password@example.org/asset'));
  await assert.rejects(api.submit(sample,false),/approved/);
  assert.equal(calls,0);
});
test('sign exactly the full-frame payload once; a lost response is not retried',async()=>{
  let calls=0;
  const api=service({key:'qa',secret:'test-secret',request:async(url,options)=>{
    calls++;
    assert.equal(url,'https://api.zhaoli.com/v-w-c/gateway/ve/work/free');
    const data=JSON.parse(options.body), md5=s=>createHash('md5').update(s).digest('hex');
    assert.equal(options.headers.AppSign,md5(md5(options.body)+'test-secret'));
    assert.equal(options.redirect,'error');
    assert.deepEqual(data.urls,[sample]); assert.equal(data.needChineseOcclude,1); assert.equal(data.videoInpaintLang,'all');
    assert.equal(JSON.parse(data.extraOptions).extra_inpaint_config.model,'advanced_full');
    throw Error('transport details should not reach the client');
  }});
  await assert.rejects(api.submit(sample,true),e=>/history/.test(e.message)&&!e.message.includes('transport details'));
  assert.equal(calls,1);
});
test('only return the requested job; withhold URLs until success and reject malformed result links',async()=>{
  let row={id:99,processStatus:1,videoUrl:'https://example.org/unrelated'};
  const api=service({key:'qa',secret:'test',request:async(url,opts)=>{
    assert.ok(url.endsWith('/status')); assert.deepEqual(JSON.parse(opts.body),{idWorks:['17']});
    return Response.json({code:1000,body:{content:[row]}});
  }});
  await assert.rejects(api.status('17'),/matching/);
  row={...row,id:17,processStatus:-1};
  assert.deepEqual(await api.status('17'),{state:'processing',work_id:'17'});
  row.processStatus=73;
  assert.deepEqual(await api.status('17'),{state:'failed',work_id:'17',status_code:73});
  row.processStatus=1; row.videoUrl='file:///etc/passwd';
  await assert.rejects(api.status('17'),/link is unavailable/);
  row.videoUrl='http://example.org/result.mp4';
  assert.equal((await api.status('17')).download_url,'https://example.org/result.mp4');
});
