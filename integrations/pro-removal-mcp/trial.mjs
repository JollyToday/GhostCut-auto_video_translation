import {randomBytes, randomUUID} from 'node:crypto';
import {constants} from 'node:fs';
import {link, lstat, open, unlink} from 'node:fs/promises';
import path, {join} from 'node:path';
import {homedir} from 'node:os';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const endpoint='https://api.weydub.com/agent-trial/v1/removal';
const states=new Set(['queued','submitting','processing','failed','needs_review','expired','ready']);
const limit=16*1024*1024;

export function clipFolder(value,paths=path,home=homedir()) {
  const error='Choose one dedicated clip folder using an absolute path. Put your authorized video there as input.mp4.';
  if (!value || !paths.isAbsolute(value) || (paths.sep==='\\' && !paths.parse(value).root.includes(':') && !value.startsWith('\\\\'))) throw Error(error);
  const dir=paths.resolve(value);
  if (!paths.relative(paths.parse(dir).root,dir) || !paths.relative(home,dir)) throw Error(error);
  return dir;
}
export async function checkFolder(dir) {
  if (!(await lstat(dir)).isDirectory()) throw Error('Select a real clip folder rather than a file or symbolic link.');
}

async function readRegular(path,max) {
  const before=await lstat(path);
  if(!before.isFile()) throw Error('Expected a regular file, not a link.');
  const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try {
    const info=await file.stat();
    if (!info.isFile() || info.dev!==before.dev || info.ino!==before.ino || info.size<1 || info.size>max) throw Error('Expected a regular file within the size limit.');
    const bytes=Buffer.alloc(info.size+1);
    let size=0;
    while (size<bytes.length) {
      const {bytesRead}=await file.read(bytes,size,bytes.length-size,null);
      if (!bytesRead) break;
      size+=bytesRead;
    }
    if (size!==info.size) throw Error('The file changed while reading. Finish copying it before trying again.');
    return bytes.subarray(0,size);
  } finally { await file.close(); }
}

// Link a completed temporary file into place without replacing any existing file.
async function publishFile(dir,name,write) {
  const temp=join(dir,`.weydub-${randomUUID()}.tmp`);
  const file=await open(temp,'wx',0o600);
  try {
    await write(file);
    await file.close();
    await link(temp,join(dir,name));
  } finally { await file.close(); await unlink(temp); }
}

export function trialService(dir,send=fetch) {
  async function request(submit) {
    dir=clipFolder(dir);
    await checkFolder(dir);
    let body;
    if (submit) {
      body=await readRegular(join(dir,'input.mp4'),limit).catch(e=>{
        if (e.code==='ENOENT') throw Error('Put your authorized H.264 MP4 in the selected folder as input.mp4.');
        throw e;
      });
      if (body.length<16 || body.toString('ascii',4,8)!=='ftyp') throw Error('Expected an H.264 MP4 up to 60 seconds and 16 MiB.');
      try { await publishFile(dir,'.weydub-receipt',f=>f.writeFile(randomBytes(32).toString('hex')+'\n')); }
      catch(e) { if (e.code!=='EEXIST') throw e; }
    }
    let receipt;
    try { receipt=(await readRegular(join(dir,'.weydub-receipt'),65)).toString().trim(); }
    catch(e) { if (e.code==='ENOENT') throw Error('No trial receipt in this folder. Submit input.mp4 first.'); throw e; }
    if (!/^[0-9a-f]{64}$/.test(receipt)) throw Error('The saved trial receipt is invalid.');
    const headers={'X-Trial-Receipt':receipt};
    if (submit) headers['Content-Type']='video/mp4';
    const response=await send(endpoint,{method:submit?'POST':'GET',headers,body,redirect:'error',signal:AbortSignal.timeout(90000)});
    if (response.status===429) throw Error('Shared trial capacity is unavailable. Keep this folder; no paid job was started.');
    if (response.status===409) throw Error('This receipt belongs to another clip. Use a new empty folder for another video.');
    if (!response.ok) throw Error(`Weydub trial returned HTTP ${response.status}. Keep the same folder and check the result before retrying.`);
    const data=await response.json();
    if (!states.has(data?.state)) throw Error('Unrecognized trial status. Keep the receipt and check again.');
    return data;
  }
  return {
    async submit(confirm) {
      if (confirm!==true) throw Error('Confirm permission to upload input.mp4 to Weydub before starting.');
      return {state:(await request(true)).state,billable:false};
    },
    async save() {
      const data=await request(false);
      if (data.state!=='ready') return {state:data.state,billable:false};
      const url=new URL(data.videoUrl);
      if (url.origin!=='https://gc70.cdn.izhaoli.cn' || url.username || url.password) throw Error('Unexpected media host. Keep the receipt and contact Weydub.');
      if (await lstat(join(dir,'cleaned.mp4')).then(()=>true,e=>{if (e.code==='ENOENT') return false; throw e;}))
        throw Error('cleaned.mp4 already exists. Nothing was overwritten. Move it before downloading another copy.');
      const media=await send(url,{redirect:'error',signal:AbortSignal.timeout(120000)});
      if (media.status!==200 || !media.body || media.headers.has('content-range') ||
          !/^(video\/mp4|application\/octet-stream)(;|$)/i.test(media.headers.get('content-type')||''))
        throw Error('The CDN did not return a complete MP4. Retry save_trial_result with the same folder.');
      let prefix=Buffer.alloc(0);
      const verify=new Transform({transform(chunk,_,done){
        if (prefix.length<8) {
          prefix=Buffer.concat([prefix,chunk.subarray(0,8-prefix.length)]);
          if (prefix.length===8 && prefix.toString('ascii',4)!=='ftyp') return done(Error('The download is not an MP4.'));
        }
        done(null,chunk);
      },flush(done){done(prefix.length<8?Error('Incomplete MP4 header.'):null);}});
      await publishFile(dir,'cleaned.mp4',f=>pipeline(Readable.fromWeb(media.body),verify,f.createWriteStream()));
      return {state:'downloaded',file:'cleaned.mp4',billable:false};
    }
  };
}
