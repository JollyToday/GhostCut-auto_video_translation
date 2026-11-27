import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,posix,win32} from 'node:path';
import test from 'node:test';
import {trialService,clipFolder} from './trial.mjs';

const sample=await readFile(new URL('../../examples/api-market/practice-6s.mp4',import.meta.url));
async function folder(t) {
  const dir=await mkdtemp(join(tmpdir(),'weydub-trial-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  return dir;
}
test('consent, exact input and no file following before upload',async t=>{
  const dir=await folder(t), never=()=>assert.fail('Unexpected network request');
  const api=trialService(dir,never);
  await assert.rejects(api.submit(false),/permission/);
  await assert.rejects(trialService(null,never).submit(true),/folder/);
  await assert.rejects(api.save(),/No trial receipt/);
  await symlink('other.mp4',join(dir,'input.mp4'));
  await writeFile(join(dir,'other.mp4'),sample);
  await assert.rejects(api.submit(true),/regular file/);
  assert.deepEqual((await readdir(dir)).sort(),['input.mp4','other.mp4']);
});
test('dedicated folder cannot be a root or the entire home',()=>{
  for(const p of ['/tmp/..','/','/home/qa/.','clip']) assert.throws(()=>clipFolder(p,posix,'/home/qa'),/dedicated/);
  for(const p of ['C:\\','C:\\data\\..','\\\\host\\share\\','\\clip','C:clip','C:\\USERS\\qa']) assert.throws(()=>clipFolder(p,win32,'C:\\Users\\QA'),/dedicated/);
  assert.equal(clipFolder('C:\\Users\\QA\\clip\\.',win32,'C:\\Users\\QA'),'C:\\Users\\QA\\clip');
});
test('receipt survives concurrent retries, restart, quota refusal and broken download',async t=>{
  const dir=await folder(t),receipts=new Set();
  await writeFile(join(dir,'input.mp4'),sample);
  let stage='queued',media='short',posts=0;
  const send=async(url,opts)=>{
    if (url instanceof URL) {
      assert.equal(url.origin,'https://gc70.cdn.izhaoli.cn');
      assert.equal(opts.headers,undefined);
      return new Response(media==='short' ? sample.subarray(0,4):sample,{headers:{'content-type':'video/mp4'}});
    }
    assert.equal(url,'https://api.weydub.com/agent-trial/v1/removal');
    assert.equal(opts.redirect,'error');
    receipts.add(opts.headers['X-Trial-Receipt']);
    if (opts.method==='POST') {
      posts++; assert.deepEqual(opts.body,sample);
      if (stage==='full') return Response.json({},{status:429});
    }
    return Response.json({state:stage,videoUrl:'https://gc70.cdn.izhaoli.cn/qa.mp4'});
  };
  const api=trialService(dir,send);
  await Promise.all([api.submit(true),api.submit(true)]);
  stage='full';await assert.rejects(api.submit(true),/no paid job/);
  stage='processing';assert.deepEqual(await api.save(),{state:'processing',billable:false});
  stage='ready';await assert.rejects(api.save(),/Incomplete MP4/);
  assert.deepEqual((await readdir(dir)).sort(),['.weydub-receipt','input.mp4']);
  media='ok';
  assert.deepEqual(await trialService(dir,send).save(),{state:'downloaded',file:'cleaned.mp4',billable:false});
  assert.deepEqual(await readFile(join(dir,'cleaned.mp4')),sample);
  await assert.rejects(api.save(),/already exists/);
  assert.equal(receipts.size,1);assert.equal(posts,3);
});
