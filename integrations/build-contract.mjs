import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';

const collection=JSON.parse(await readFile(new URL('../examples/Weydub.postman_collection.json',import.meta.url)));
const ids=['erase','ocr','dub','image','video-status','image-status'];
const operations={};
for (const [i,item] of collection.item.entries()) {
  const id=ids[i], target=new URL(item.request.url);
  assert.equal(target.origin,'https://api.zhaoli.com');
  assert.equal(item.request.method,'POST');
  const body=JSON.parse(item.request.body.raw.replace('{{image_job_id}}','"{{image_job_id}}"'));
  operations[id]={path:target.pathname,body};
}
assert.equal(collection.item.length,ids.length);
const wire=JSON.stringify(operations,null,2)+'\n';
for (const dir of ['comfy','n8n']) {
  const url=new URL(`./${dir}/contract.json`,import.meta.url);
  if(process.argv.includes('--check')) assert.equal(await readFile(url,'utf8'),wire,dir);
  else await writeFile(url,wire);
}
