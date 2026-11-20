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

test('wait returns the translated file in one row and a restarted run cannot submit it twice',async()=>{
  const actor=store(), calls=[];
  const send=async(op,id)=>{
    calls.push([op,id]);
    if(op==='image')return 'Job 742\n';
    return JSON.stringify(calls.length===2?{status:0,output:'https://example.org/source'}:{status:1,output:'https://example.org/translated.jpg'});
  };
  const settings={...input,waitForResult:true};
  await ownJob(actor,settings,send,async()=>{});
  await ownJob(actor,settings,send,async()=>{throw Error('duplicate poll');});
  assert.deepEqual(calls,[['image',input.input],['image-status','742'],['image-status','742']]);
  assert.equal(actor.rows.length,1);assert.equal(actor.rows[0].output,'https://example.org/translated.jpg');
  assert.equal(actor.rows[0].operation,'image');assert.equal(actor.rows[0].state,'ready');
});

test('slow jobs, rejected queries and locked results keep the original ID, with no provisional links',async()=>{
  for(const [reply,expectedState] of [[{status:-1},'processing'],[null,'submitted'],[{status:73},'failed'],[{status:83},'failed'],[{status:1,targetSubtitles:'https://example.org/other.srt'},'missing-output']]){
    const actor=store();let creates=0,reads=0;
    await ownJob(actor,{...input,operation:'dub',waitForResult:true},async(op,value)=>{
      if(op==='dub'){creates++;return 'Job 941\n';}
      assert.equal(op,'video-status');assert.equal(value,'941');reads++;
      if(!reply)throw Error('503');
      return JSON.stringify({...reply,...(reply.status===1?{}:{video:'https://example.org/provisional'})});
    },async()=>{});
    const [row]=actor.rows;
    assert.equal(creates,1);assert.ok(reads>=1&&reads<=16);
    assert.equal(row.jobId,'941');assert.equal(row.state,expectedState);
    assert.equal(row.nextOperation,'video-status');assert.equal(row.video,undefined);assert.equal(row.targetSubtitles,undefined);
  }
});
