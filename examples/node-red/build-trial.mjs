// Rebuild the importable flow without installing any npm packages.
import {writeFile} from 'node:fs/promises';

async function prepare() {
  const fail = message => [null, null, {payload:{state:'attention', message}}];
  const file = env.get('WEYDUB_TRIAL_FILE');
  if (!file || !paths.isAbsolute(file) || !/\.mp4$/i.test(file)) {
    return fail('Open the flow tab settings and set WEYDUB_TRIAL_FILE to the full local path of your MP4.');
  }
  const upload = msg.topic === 'upload';
  if (!upload && msg.topic !== 'status') return fail('Choose upload or check status.');
  const receiptPath = file + '.weydub-receipt';
  let body;
  try {
    if (upload) {
      const handle = await fs.promises.open(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
      try {
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size < 16 || stat.size > 16777216) return fail('Choose a regular H.264 MP4 up to 16 MiB and 60 seconds.');
        body = Buffer.alloc(stat.size);
        for (let offset = 0; offset < body.length;) {
          const {bytesRead} = await handle.read(body, offset, body.length - offset, offset);
          if (!bytesRead) return fail('The video changed while reading. Close it and try again.');
          offset += bytesRead;
        }
        if ((await handle.stat()).size !== body.length || body.toString('ascii', 4, 8) !== 'ftyp') return fail('Choose a complete H.264 MP4.');
      } finally { await handle.close(); }
      try {
        await fs.promises.writeFile(receiptPath, crypto.randomBytes(32).toString('hex') + '\n', {flag:'wx', mode:0o600});
      } catch (e) { if (e.code !== 'EEXIST') throw e; }
    }
    const handle = await fs.promises.open(receiptPath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK | (fs.constants.O_NOFOLLOW || 0));
    let token;
    try {
      const st = await handle.stat();
      if (!st.isFile() || st.size < 64 || st.size > 66) return fail('Keep the original receipt. An upload is never retried with a new receipt automatically.');
      token = (await handle.readFile('utf8')).trim();
    } finally { await handle.close(); }
    if (!/^[a-f0-9]{64}$/.test(token)) return fail('The saved receipt is invalid. Restore the original receipt.');
    const headers = {'X-Trial-Receipt':token};
    if (upload) headers['Content-Type'] = 'video/mp4';
    const request = {headers, followRedirects:false, requestTimeout:90000, ...(upload ? {payload:body} : {})};
    return upload ? [request,null,null] : [null,request,null];
  } catch (e) {
    if (e.code === 'ENOENT' && !upload) return fail('No receipt for this path. Upload the authorized clip once, or restore its original receipt.');
    return fail('Check the MP4 path and file permissions on the Node-RED host. The flow needs to write a private receipt beside the clip.');
  }
}

function report() {
  const code = msg.statusCode, data = msg.payload;
  const out = (state,message) => ({payload:{state,message}});
  if (code === 429) return out('unavailable','Shared trial capacity is unavailable. Keep the receipt and try later; no paid job was started.');
  if (code === 409) return out('attention','This receipt belongs to different video bytes. Restore the original clip to check its result.');
  if (code === 404) return out('unknown','No job was found. After a timeout retry the identical clip with its existing receipt.');
  if (code === 422 || code === 413 || code === 415) return out('rejected','Use an H.264 MP4, up to 60 seconds and 16 MiB, with optional AAC audio.');
  if (code !== 200 && code !== 202) return out('attention','The request was not confirmed. Keep the receipt and use Check status.');
  if (data?.state === 'ready' && data.videoUrl) {
    let url;
    try { url = new URL(data.videoUrl); } catch {}
    if (!url || url.protocol !== 'https:' || url.username || url.password) return out('attention','No usable download link. Check status again.');
    return {payload:{state:'ready',download_url:url.href,message:'Open the private download URL to save your cleaned MP4.'}};
  }
  if (['queued','submitting','processing','ready'].includes(data?.state)) {
    const result = out(data.state,'Click Check status to get the private MP4 link.');
    if (data.replayed === true) {
      result.payload.replayed = true;
      result.payload.message = 'The same clip was already accepted. Check status using its existing receipt.';
    }
    return result;
  }
  if (['failed','expired','needs_review'].includes(data?.state)) return out(data.state,'This job cannot be downloaded. Keep its receipt; do not start a replacement automatically.');
  return out('attention','Unrecognized response. Keep your receipt and check status.');
}

const base = '89aa001f0c05bb', tab = base+'00';
const node = (id,type,name,x,y,wires,extra={}) => ({id:base+id,z:tab,type,name,x,y,wires:wires.map(p=>p.map(i=>base+i)),...extra});
const inject = (id,name,topic,y) => node(id,'inject',name,170,y,[['03']],{props:[{p:'topic',vt:'str'}],topic,once:false,repeat:'',crontab:''});
const fn = (id,name,x,y,wires,code,libs=[]) => node(id,'function',name,x,y,wires,{outputs:wires.length,libs,func:code.toString().slice(code.toString().indexOf('{')+1,-1).trim()});
const req = (id,name,y,method) => node(id,'http request',name,740,y,[['06']],{method,url:'https://api.weydub.com/agent-trial/v1/removal',ret:'obj',paytoqs:'ignore',persist:false,senderr:true,headers:[]});
const nodes = [
  {id:tab,type:'tab',label:'Weydub free subtitle removal',disabled:false,env:[{name:'WEYDUB_TRIAL_FILE',type:'str',value:''}],
    info:'Set WEYDUB_TRIAL_FILE to a local MP4 in a private folder. Deploy, open Debug, then click Upload only if authorized to send the file to Weydub. Full-frame Pro can erase labels and prices. Check status to download. Preserve the adjacent .weydub-receipt file.\n\n[Setup and practice clip](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/examples/node-red) | [Choose a smaller area in Weydub](https://weydub.com/subtitle-removal/).'},
  inject('01','Upload my authorized MP4','upload',100), inject('02','Check status / get MP4','status',180),
  fn('03','Read clip and reuse private receipt',465,140,[['04'],['05'],['07']],prepare,[{var:'fs',module:'fs'},{var:'paths',module:'path'},{var:'crypto',module:'crypto'}]),
  req('04','Send to free Pro trial',90,'POST'),req('05','Look up receipt',160,'GET'),
  node('08','catch','Connection error',740,230,[['06']],{scope:[base+'04',base+'05'],uncaught:false}),
  fn('06','Read trial result',990,150,[['07']],report),
  node('07','debug','State or private MP4 link',1000,310,[],{active:true,tosidebar:true,console:false,tostatus:false,complete:'payload',targetType:'msg'})
];
await writeFile(new URL('./free-pro-subtitle-removal.json',import.meta.url),JSON.stringify(nodes,null,2)+'\n');
