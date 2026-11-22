import {randomBytes} from 'node:crypto';
import {open, readFile, realpath, stat, writeFile, unlink} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

const endpoint = 'https://api.weydub.com/agent-trial/v1/removal';
const usage = 'submit CLIP.mp4 RECEIPT_FILE --confirm-upload | status RECEIPT_FILE | download RECEIPT_FILE OUTPUT.mp4';
const limit = 16 * 1024 * 1024;

async function receipt(file, create) {
  if (create) {
    try {
      await writeFile(file, randomBytes(32).toString('hex')+'\n', {flag:'wx', mode:0o600});
    } catch (err) { if (err.code !== 'EEXIST') throw err; }
  }
  const value = (await readFile(file,'utf8')).trim();
  if (!/^[0-9a-f]{64}$/.test(value)) throw Error('Invalid receipt file. Keep the original file from submit.');
  return value;
}

export async function run(args, send = fetch) {
  const {positionals:[action,first,second,...rest], values} = parseArgs({
    args, allowPositionals:true, options:{'confirm-upload':{type:'boolean'},help:{type:'boolean'}},
  });
  if (values.help) return {usage};
  if (!['submit','status','download'].includes(action) || rest.length || !first ||
      (action === 'status' ? !!second : !second) || (action !== 'submit' && values['confirm-upload'])) throw Error(usage);
  const submit = action === 'submit';
  let body;
  if (submit) {
    if (!values['confirm-upload']) throw Error('Confirm permission to send this file to Weydub, then include --confirm-upload.');
    const info = await stat(first);
    if (!info.isFile() || info.size < 16 || info.size > limit) throw Error('Choose one H.264 MP4 file up to 16 MiB and 60 seconds.');
    body = await readFile(first);
  }
  const headers = {'X-Trial-Receipt':await receipt(submit ? second : first, submit)};
  if (submit) headers['Content-Type']='video/mp4';
  const response = await send(endpoint,{method:submit?'POST':'GET',headers,body,redirect:'error',signal:AbortSignal.timeout(90000)});
  const data = await response.json().catch(()=>({}));
  if (response.status === 429) throw Error('Sponsored capacity is unavailable. Keep your receipt. No paid job was started.');
  if (!response.ok) throw Error(`Weydub ${response.status}: ${data.error || 'Check status using the same receipt file.'}`);
  if (!['queued','submitting','processing','ready','failed','needs_review','expired'].includes(data.state))
    throw Error('Weydub did not confirm the state. Check status with the same receipt.');
  if (action !== 'download' || data.state !== 'ready') return {state:data.state,...(data.replayed?{replayed:true}:{})};
  const result = new URL(data.videoUrl);
  if (result.origin !== 'https://gc70.cdn.izhaoli.cn' || result.username || result.password)
    throw Error('The result is on an unconfigured media host. Keep your receipt and contact Weydub.');
  const media = await send(result,{redirect:'error',signal:AbortSignal.timeout(120000)});
  const type = media.headers.get('content-type') || '';
  if (!media.ok || !media.body || !/^video\/(?:mp4|iso\.segment|quicktime)(?:;|$)/i.test(type))
    throw Error(`Download failed (${media.status}, ${type || 'unknown content type'}). Reuse this receipt.`);
  const file = await open(second,'wx',0o600);
  try {
    await pipeline(Readable.fromWeb(media.body),file.createWriteStream());
  } catch (err) {
    await file.close(); await unlink(second); throw err;
  }
  return {state:'downloaded',file:second};
}
if (process.argv[1] && pathToFileURL(await realpath(process.argv[1])).href === import.meta.url) {
  try { console.log(JSON.stringify(await run(process.argv.slice(2)))); }
  catch (err) { console.error(err.message); process.exitCode=1; }
}
