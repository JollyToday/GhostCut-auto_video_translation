// Run with the path to an installed playwright/index.mjs. Two loopback origins; no real jobs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {chromium}=await import(pathToFileURL(resolve(process.argv[2])));
const site=new URL('../huggingface-static/',import.meta.url);
const clip=await readFile(new URL('../../examples/full-frame-removal/input.mp4',import.meta.url));
const files=new Map([['/','text/html'],['/space.css','text/css'],['/space.mjs','text/javascript'],['/comparison.webp','image/webp']]);
let permit=true, quota=true, siteOrigin, apiOrigin, receipt, accepted=0, attempts=0, options=0;
const listen=s=>new Promise(r=>s.listen(0,'127.0.0.1',()=>r(`http://127.0.0.1:${s.address().port}`)));
const gateway=createServer(async(req,res)=>{
  if(permit && req.headers.origin===siteOrigin) res.setHeader('Access-Control-Allow-Origin',siteOrigin);
  if(req.method==='OPTIONS'){
    options++;res.setHeader('Access-Control-Allow-Headers','content-type, x-confirm-upload, x-trial-receipt');
    res.setHeader('Access-Control-Allow-Methods','GET, POST');res.writeHead(permit?204:405);return res.end();
  }
  const answer=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  const token=req.headers['x-trial-receipt'];
  if(token==='invalid') return answer(400,{error:'Private receipt required'});
  assert.match(token,/^[0-9a-f]{64}$/);assert.equal(req.headers.cookie,undefined);assert.equal(req.headers.authorization,undefined);
  if(req.method==='POST'){
    assert.equal(req.headers['x-confirm-upload'],'yes');
    attempts++;if(!receipt)receipt=token;assert.equal(token,receipt);
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    assert.ok(clip.equals(Buffer.concat(chunks)));
    if(quota)return answer(429,{error:'Allowance exhausted'});
    accepted++;return answer(202,{state:'queued'});
  }
  assert.equal(token,receipt);
  return answer(200,{state:'ready',videoUrl:'https://gc70.cdn.izhaoli.cn/qa-fixture.mp4'});
});
const web=createServer(async(req,res)=>{
  if(!files.has(req.url)){res.writeHead(404);return res.end();}
  let body=await readFile(new URL(req.url==='/'?'index.html':req.url.slice(1),site));
  if(req.url==='/space.mjs')body=body.toString().replace('https://iniu-weydub-media-localization.hf.space/gradio_api/sponsored-removal',apiOrigin+'/gradio_api/sponsored-removal');
  res.writeHead(200,{'Content-Type':files.get(req.url),'Cache-Control':'no-store'});res.end(body);
});
let browser;
try{
  apiOrigin=await listen(gateway);siteOrigin=await listen(web);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage();
  // sample links are real but these QA checks must never send a receipt outside loopback.
  await page.route('https://**',r=>r.abort());
  await page.goto(siteOrigin);
  const send=page.getByRole('button',{name:'Remove subtitles',exact:true});
  await page.getByLabel('Video file').setInputFiles({name:'sample.mp4',mimeType:'video/mp4',buffer:clip});
  assert.ok(await send.isDisabled());assert.equal(attempts,0);
  await page.getByRole('checkbox').check();await send.click();
  await page.getByRole('status').filter({hasText:'No paid job'}).waitFor();
  quota=false;await send.click();await page.getByRole('status').filter({hasText:'queued'}).waitFor();
  await page.reload();await page.getByRole('button',{name:'Check status'}).click();
  const download=page.getByRole('link',{name:'Download cleaned MP4'});
  await download.waitFor({state:'visible'});
  assert.equal(await download.getAttribute('href'),'https://gc70.cdn.izhaoli.cn/qa-fixture.mp4');
  page.once('dialog',d=>d.accept());await page.getByText('Start another clip').click();
  assert.ok(await send.isDisabled());assert.ok(await page.getByText('Download cleaned MP4').isHidden());
  for(const width of [390,1280]){
    await page.setViewportSize({width,height:820});
    const image=page.locator('figure img');await image.scrollIntoViewIfNeeded();await image.evaluate(e=>e.decode());
    assert.ok(await image.evaluate(e=>e.naturalWidth>100));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(process.env.WEYDUB_QA_SCREEN_DIR)await page.screenshot({path:resolve(process.env.WEYDUB_QA_SCREEN_DIR,`hf-static-${width}.png`),fullPage:true});
  }
  permit=false;const isolated=await browser.newPage();await isolated.goto(siteOrigin);
  await isolated.getByText('Open the working media lab').waitFor();assert.ok(await isolated.locator('#submit').isDisabled());
  assert.ok(options>=1);assert.equal(accepted,1);assert.equal(attempts,2);
  console.log('PASS: real browser CORS preflight, explicit consent, quota, retry, reload/status, result link, new clip, unavailable fallback, 390/1280 layout. Fixture bytes:',clip.length,'sha256:',createHash('sha256').update(clip).digest('hex'));
}finally{
  await browser?.close();
  for(const s of [web,gateway]){s.closeAllConnections();await new Promise(r=>s.close(r));}
}
