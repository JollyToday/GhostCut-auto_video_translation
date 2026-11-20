import assert from 'node:assert/strict';
import test from 'node:test';
import {firstJob} from './rapidapi-first-job.mjs';

const env = {MEDIA_URL:'https://example.com/file.mp4', RAPIDAPI_KEY:'mock'};
const noNetwork = () => assert.fail('preview must not send a request');
test('the default is offline, even with a key; typos never trigger submission',async()=>{
  for (const op of ['image','remove','dub','edit']) {
    assert.equal((await firstJob([op],env,noNetwork)).state,'preview');
    await assert.rejects(firstJob([op,'--submt'],env,noNetwork), /Usage/);
  }
  assert.match(JSON.parse((await firstJob(['image'],{},noNetwork)).body.downloadInfo).url,/\.webp$/);
  await assert.rejects(firstJob(['dub','--submit'],{},noNetwork),/MEDIA_URL/);
  await assert.rejects(firstJob(['image','--submit'],{},noNetwork),/RAPIDAPI_KEY/);
});
test('submit uses the preview payload and gives a query for the right ID type',async()=>{
  for (const op of ['image','remove','dub','edit']) {
    const preview = await firstJob([op],env,noNetwork);
    let calls = 0;
    const r = await firstJob([op,'--submit'],env, async (url,init) => {
      calls++;
      assert.equal(url,preview.url);
      assert.equal(init.headers['x-rapidapi-host'],new URL(url).host);
      assert.equal(init.headers['x-rapidapi-key'],'mock');
      assert.equal(init.redirect,'error');
      assert.deepEqual(JSON.parse(init.body),preview.body);
      return Response.json({code:1000,body:op==='image' ? 13 : {dataList:[{id:13}],idProject:22}});
    });
    assert.equal(r.next,`node examples/rapidapi-result.mjs ${op} 13`);
    assert.equal(calls,1);
  }
  const p = await firstJob(['dub','--submit'],env,async()=>Response.json({code:1000,body:{idProject:22}}));
  assert.deepEqual(p.next.body,{idProjects:[22]});
});
test('failed credit checks, missing IDs and lost responses never retry or suggest a result query',async()=>{
  for (const makeResponse of [
    ()=>Response.json({code:4005,trace:'sample'}),
    ()=>Response.json({code:1000,body:{}}),
    ()=>new Response(null,{status:429}),
    ()=>{throw Error('timeout');},
  ]) {
    let calls = 0;
    const job = firstJob(['image','--submit'],env,async()=>{calls++;return makeResponse();});
    const out = await job.catch(e=>({advice:e.message}));
    assert.equal(calls,1);
    assert.equal(out.next,undefined);
    assert.ok(out.advice);
  }
});
test('credit refusal produces a support receipt without leaking media, credentials or unrelated headers',async()=>{
  const secretUrl = 'https://example.com/private?token=media-secret';
  const out = await firstJob(['remove','--submit'],{...env,MEDIA_URL:secretUrl},async()=>Response.json(
    {code:4005,trace:'work-trace-1',msg:secretUrl},
    {headers:{'x-rapidapi-request-id':'request-2','x-ratelimit-video-task-remaining':'394',
      'x-ratelimit-requests-remaining':'not a number','x-rapidapi-key':'buyer-secret','set-cookie':'private-cookie'}}));
  assert.equal(out.trace,'work-trace-1');
  assert.equal(out.rapidapiRequestId,'request-2');
  assert.equal(out.endpoint,'/work/fast');
  assert.deepEqual(out.meters,{'x-ratelimit-video-task-remaining':'394'});
  assert.doesNotMatch(JSON.stringify(out),/media-secret|buyer-secret|private-cookie|not a number/);
});
test('rendered captions are opt-in and invalid caption settings never submit',async()=>{
  assert.equal((await firstJob(['dub'],env,noNetwork)).body.needText,0);
  assert.equal((await firstJob(['dub'],{...env,DUB_CAPTIONS:'1'},noNetwork)).body.needText,1);
  await assert.rejects(firstJob(['dub','--submit'],{...env,DUB_CAPTIONS:'yes'},noNetwork),/DUB_CAPTIONS/);
});
