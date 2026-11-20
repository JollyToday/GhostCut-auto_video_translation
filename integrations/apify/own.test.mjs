import assert from 'node:assert/strict';
import test from 'node:test';
import {ownJob,statusRow} from './own.mjs';

const input={operation:'image',input:'https://example.org/input.webp',submit:true,appKey:'qa-example',appSecret:'test-only'};
function store(){
  const records=new Map(),rows=[];
  return {rows,records,getValue:async k=>records.get(k),setValue:async(k,v)=>records.set(k,v),
    pushData:async v=>rows.push(v),openDataset:async()=>({getData:async()=>({items:rows})})};
}

test('restart after dataset outage reuses saved job and writes one result',async()=>{
  const actor=store();let sent=0,first=true;
  actor.pushData=async v=>{if(first){first=false;throw Error('storage unavailable');}actor.rows.push(v);};
  const send=async()=>{sent++;return 'Job 123\n...';};
  await assert.rejects(ownJob(actor,input,send),/storage unavailable/);
  await ownJob(actor,input,send);await ownJob(actor,input,send);
  assert.equal(sent,1);assert.equal(actor.rows.length,1);assert.equal(actor.rows[0].jobId,'123');
  assert.doesNotMatch(JSON.stringify([...actor.records.values()]),/qa-example|test-only|example.org/);
  await assert.rejects(ownJob(actor,{...input,target:'pt'},send),/different submission/);assert.equal(sent,1);
});

test('ambiguous create does not retry; missing credentials cannot create or query',async()=>{
  const actor=store();let sent=0;
  const send=async()=>{sent++;throw Error('network timeout');};
  await assert.rejects(ownJob(actor,input,send),/timeout/);
  await assert.rejects(ownJob(actor,input,send),/job history/);
  for(const op of ['image','image-status'])await assert.rejects(ownJob(actor,{...input,operation:op,appKey:''},send),/AppKey/);
  assert.equal(sent,1);
});

test('dataset distinguishes unfinished, failed, finished without a file, and downloadable results',()=>{
  assert.equal(statusRow('video-status','21',{status:-3,video:'https://example.org/source'}).state,'processing');
  assert.match(statusRow('video-status','21',{status:83}).nextAction,/unlock/);
  assert.equal(statusRow('image-status','21',{status:43}).state,'failed');
  assert.equal(statusRow('image-status','21',{}).state,'unknown');
  assert.equal(statusRow('image-status','21',{status:1,output:'not a URL'}).state,'missing-output');
  assert.deepEqual(statusRow('video-status','21',{status:1,sourceSubtitles:'https://example.org/file.srt'}).files,['sourceSubtitles']);
});
