import {open, readFile, realpath, stat, unlink} from 'node:fs/promises';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {pathToFileURL} from 'node:url';

const base = 'https://prod.api.market/api/v1/weydub/pro-subtitle-removal';
const states = new Set(['queued','submitting','processing','ready','failed','needs_review','expired']);
const receiptPattern = /^[0-9a-f]{64}\.[0-9a-f]{64}$/;
const help = `Set API_MARKET_BUYER_KEY to your subscribed test key. Use one receipt file per video.
  node buyer.mjs receipt RECEIPT_FILE
  node buyer.mjs upload RECEIPT_FILE INPUT.mp4
  node buyer.mjs status RECEIPT_FILE
  node buyer.mjs claim RECEIPT_FILE NEW_OUTPUT.mp4 --confirm-claim
Only claim can consume delivery units. Use status after a timeout; keep the receipt private.`;

export async function run(args, {key=process.env.API_MARKET_BUYER_KEY, send=fetch}={}) {
  if (!args.length || args[0] === '--help') return help;
  const [mode, file, media, confirm] = args;
  if (args.length !== ({receipt:2,upload:3,status:2,claim:4})[mode] || !file ||
      (mode === 'claim' && confirm !== '--confirm-claim')) throw Error(help);
  if (!key?.trim()) throw Error('Set API_MARKET_BUYER_KEY to your subscribed API.market key.');

  const call = async (method, route, receipt, body) => {
    const headers = {'x-api-market-key':key, Accept:'application/json'};
    if (receipt) headers['X-Removal-Receipt']=receipt;
    if (body) headers['Content-Type']='video/mp4';
    const r = await send(base+route, {method,headers,body,redirect:'error',signal:AbortSignal.timeout(90000)});
    const data = await r.json().catch(()=>null);
    if (!r.ok) {
      const hint = {receipt_access:'the Weydub origin rejected receipt access',
        media_access:'the Weydub origin rejected access to this media operation',
        receipt_method:'use POST to issue a receipt'}[data?.code];
      throw Error(`${method} ${route}: HTTP ${r.status}. ${typeof hint==='string' ? hint+'. ' : ''}Check the subscription and the same receipt before retrying.`);
    }
    return data;
  };
  if (mode==='receipt') {
    const f=await open(file,'wx',0o600);
    try {
      const r=await call('POST','/receipts');
      if (!receiptPattern.test(r?.receipt ?? '')) throw Error('The gateway did not issue a valid receipt.');
      await f.writeFile(r.receipt+'\n'); await f.sync();
    } catch (error) { await unlink(file); throw error; } finally { await f.close(); }
    return 'Private receipt saved. Use the same file for upload, status and claim.';
  }
  const receipt=(await readFile(file,'utf8')).trim();
  if (!receiptPattern.test(receipt)) throw Error('Invalid receipt file; use the original one.');
  if (mode==='upload') {
    const info=await stat(media);
    if (!info.isFile() || info.size < 16 || info.size > 16*1024*1024) throw Error('Choose an H.264 MP4 up to 60 seconds and 16 MiB.');
    const body=await readFile(media);
    if (body.toString('ascii',4,8)!=='ftyp') throw Error('Expected an MP4 file, not a webpage, path or URL.');
    const result=await call('POST','/removal',receipt,body);
    if (!states.has(result?.state)) throw Error('Upload not confirmed; check status with this receipt.');
    return `Upload: ${result.state}. Check status with the same receipt.`;
  }
  const status=await call('GET','/removal',receipt);
  if (!states.has(status?.state)) throw Error('The gateway did not confirm the job state.');
  if (mode==='status' || status.state!=='ready') return `Status: ${status.state}. No claim made.`;

  // Refuse an occupied or unwritable path before making the metered claim.
  const output=await open(media,'wx',0o600);
  try {
    const result=await call('POST','/delivery',receipt);
    const url=new URL(result?.videoUrl);
    if (result.state!=='ready' || url.protocol!=='https:' || url.username || url.password) throw Error('No valid download URL. Keep your receipt.');
    const response=await send(url,{redirect:'error',signal:AbortSignal.timeout(120000)});
    if (!response.ok || !response.body || !/^(?:video\/mp4|application\/octet-stream)(?:\s*;|$)/i.test(response.headers.get('content-type')||''))
      throw Error('Could not download an MP4. Keep the original receipt.');
    let prefix=Buffer.alloc(0);
    const mp4=new Transform({transform(chunk,_,done){
      if (prefix.length<8) {
        prefix=Buffer.concat([prefix,chunk.subarray(0,8-prefix.length)]);
        if (prefix.length===8 && prefix.toString('ascii',4)!=='ftyp') return done(Error('Download was not an MP4.'));
      }
      done(null,chunk);
    },flush(done){done(prefix.length<8 ? Error('Download ended before the MP4 header.') : null);}});
    await pipeline(Readable.fromWeb(response.body),mp4,output.createWriteStream());
    return `MP4 downloaded to ${media}.`;
  } catch(error) {
    await output.close(); await unlink(media);
    throw error;
  } finally { await output.close(); }
}
const entry=process.argv[1] && await realpath(process.argv[1]).catch(()=>null);
if (entry && pathToFileURL(entry).href===import.meta.url) {
  try { console.log(await run(process.argv.slice(2))); }
  catch(error) { console.error(error.message); process.exitCode=1; }
}
