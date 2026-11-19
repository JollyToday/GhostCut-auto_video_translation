import test from 'node:test';
import assert from 'node:assert/strict';
import {lookup} from './rapidapi-result.mjs';

const reply = body => async () => Response.json({code:1000, body});
test('checks the right work and never calls create', async () => {
  for (const [op, host] of Object.entries({remove:'auto-video-watermark-or-subtitles-remove',dub:'video-translation',edit:'video-reproduction-or-de-duplication1'})) {
    const r = await lookup(op,'71','test',async (url, init) => {
      assert.equal(url, `https://${host}.p.rapidapi.com/work/status`);
      assert.deepEqual(JSON.parse(init.body),{idWorks:[71]});
      assert.equal(init.redirect,'error');
      return Response.json({code:1000,body:{content:[
        {id:8,processStatus:1,videoUrl:'https://example.com/wrong.mp4'},
        {id:71,processStatus:1,videoUrl:'https://example.com/correct.mp4'},
      ]}});
    });
    assert.equal(r.url,'https://example.com/correct.mp4');
  }
});
test('selects the rendered image from both response formats',async()=>{
  const result={output_url:'https://example.com/translated.webp',inpaint_url:'https://example.com/clean.webp'};
  for(const value of [result, JSON.stringify(result)]) {
    assert.equal((await lookup('image','71','test',reply({id:71,status:1,result:value}))).url,result.output_url);
  }
});
test('distinguishes failed processing, unready work, missing work and insufficient credit',async()=>{
  assert.equal((await lookup('image','71','test',reply({status:43}))).state,'needs_attention');
  assert.equal((await lookup('image','71','test',reply({status:-1}))).state,'not_ready');
  assert.equal((await lookup('image','71','test',reply({status:1,result:{}}))).state,'missing_output');
  assert.equal((await lookup('dub','71','test',reply({content:[]}))).state,'no_match');
  assert.equal((await lookup('image','71','test',async()=>Response.json({code:4005,trace:'test'}))).code,4005);
  await assert.rejects(lookup('other','71','test'),/Usage/);
});
