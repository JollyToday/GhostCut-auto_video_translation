// Rebuild the portable Node-RED editor export with `node build-flow.mjs`.
import {writeFile} from 'node:fs/promises';

function prepare() {
  const submit = msg.topic === 'submit';
  const fail = text => [null, null, {payload: {state: 'attention', message: text}}];
  const key = env.get('WEYDUB_APP_KEY');
  const secret = env.get('WEYDUB_APP_SECRET');
  const crypto = global.get('weydubCrypto');
  if (!key || !secret || !crypto) return fail('Set your Weydub credentials and enable weydubCrypto in settings.js. Nothing was submitted.');
  const last = flow.get('lastSubmission');
  const md5 = data => crypto.createHash('md5').update(data).digest('hex');
  let body, tag;
  if (submit) {
    const value = msg.payload;
    let url;
    try { url = new URL(value); } catch {}
    if (typeof value !== 'string' || !url || url.protocol !== 'https:' || url.username || url.password || /[\s\\]/.test(value))
      return fail('Set WEYDUB_VIDEO_URL to a direct HTTPS video URL without embedded credentials.');
    tag = crypto.createHash('sha256').update(value).digest('hex');
    if (last && !last.id) return fail('A submission has no confirmed work ID yet. Check your Weydub history before starting another job.');
    if (last && last.tag === tag) return [null, null, {payload: {state: 'already_submitted', work_id: last.id, message: 'Use Check status with this work ID.'}}];
    body = {urls: [value], needChineseOcclude: 1, videoInpaintLang: 'all',
      extraOptions: JSON.stringify({extra_inpaint_config: {model: 'advanced_full'}})};
    flow.set('lastSubmission', {tag});
  } else {
    const id = String(msg.payload || last?.id || '').trim();
    if (!/^[1-9]\d*$/.test(id)) return fail('Enter the work ID from your Weydub account or submit a clip first.');
    body = {idWorks: [id]};
  }
  const payload = JSON.stringify(body);
  const request = {payload, tag, action: submit ? 'submit' : 'check', work_id: body.idWorks?.[0],
    followRedirects: false, requestTimeout: 45000,
    headers: {'Content-Type': 'application/json', AppKey: key, AppSign: md5(md5(payload) + secret)}};
  return submit ? [request, null, null] : [null, request, null];
}

function report() {
  const submit = msg.action === 'submit';
  const failure = message => ({payload: {state: 'attention', message: message + (submit ? ' Check your Weydub history before submitting again.' : '')}});
  if (msg.error || msg.statusCode !== 200) return failure('The service did not confirm the request.');
  const data = msg.payload;
  if (data?.code !== 1000) return failure('Weydub rejected the request. Check the credentials and account balance.');
  if (submit) {
    const id = String(data.body?.dataList?.[0]?.id || '');
    if (!/^[1-9]\d*$/.test(id)) return failure('No work ID was returned.');
    flow.set('lastSubmission', {tag: msg.tag, id});
    return {payload: {state: 'accepted', work_id: id, message: 'Save this ID. Click Check status to get the result.'}};
  }
  const id = msg.work_id;
  const row = data.body?.content?.find(r => String(r.id) === id);
  if (!row || !Number.isInteger(row.processStatus)) return failure('No matching work ID in this account.');
  if (row.processStatus < 1) return {payload: {state: 'processing', work_id: id, message: 'Check the same ID again in a few minutes.'}};
  if (row.processStatus !== 1) return {payload: {state: 'failed', work_id: id, message: 'Review this job in Weydub.'}};
  let url;
  try { url = new URL(row.videoUrl); } catch {}
  if (!url || !['https:', 'http:'].includes(url.protocol) || url.username || url.password) return failure('The result has no usable download link.');
  url.protocol = 'https:';
  return {payload: {state: 'ready', work_id: id, download_url: url.href, message: 'Open the private download URL to save your MP4.'}};
}

const id = 'd63fcdf6c02a1a00';
const n = (suffix, type, name, x, y, wires, more = {}) =>
  ({id: id.slice(0, -2) + suffix, type, z: id, name, x, y,
    wires: wires.map(port => port.map(s => id.slice(0,-2) + s)), ...more});
const func = (suffix, name, x, y, wires, f) => n(suffix, 'function', name, x, y, wires,
  {func: f.toString().slice(f.toString().indexOf('{') + 1, -1).trim(), outputs: wires.length, noerr: 0, initialize: '', finalize: '', libs: []});
const inject = (suffix, name, topic, payload, payloadType, y) => n(suffix, 'inject', name, 165, y, [['03']], {
  props: [{p: 'payload'}, {p:'topic', vt:'str'}], topic, payload, payloadType, repeat:'', crontab:'', once:false, onceDelay:0.1});
const http = (suffix, name, path, y) => n(suffix, 'http request', name, 710, y, [['06']], {
  method:'POST', ret:'obj', paytoqs:'ignore', url:'https://api.zhaoli.com/v-w-c/gateway/ve/work/'+path,
  senderr:true, persist:false, headers:[]});
const nodes = [
  {id,type:'tab', label:'Weydub Pro subtitle removal',disabled:false,info:'Use only on a private Node-RED editor. Start once, then check the work ID. See the README for setup and authorized media examples.'},
  inject('01','Submit one video (uses credits)','submit','WEYDUB_VIDEO_URL','env',100),
  inject('02','Check status (latest or saved ID)','check','','str',180),
  func('03','Validate and sign',440,140,[['04'],['05'],['07']],prepare),
  http('04','Submit full-frame Pro','free',90), http('05','Look up work ID','status',155),
  n('08','catch','Connection error',710,225,[['06']],{scope:[id.slice(0,-2)+'04',id.slice(0,-2)+'05'],uncaught:false}),
  func('06','Read job result',990,145,[['07']],report),
  n('07','debug','Work ID, status or private download',1000,310,[],{active:true,tosidebar:true,console:false,tostatus:false,complete:'payload',targetType:'msg'}),
];
await writeFile(new URL('./pro-subtitle-removal.json',import.meta.url),JSON.stringify(nodes,null,2)+'\n');
