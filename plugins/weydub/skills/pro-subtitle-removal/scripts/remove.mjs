import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';

const usage = 'Usage: node remove.mjs preview|submit HTTPS_VIDEO_URL [--model pro|lite], or node remove.mjs status JOB_ID';
const md5 = text => createHash('md5').update(text).digest('hex');
const validId = value => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));

async function main() {
  const {values, positionals: [action, input, ...extra]} = parseArgs({
    allowPositionals: true, options: {model: {type: 'string'}, help: {type: 'boolean'}},
  });
  if (values.help) return {usage};
  if (!input || extra.length || !['preview', 'submit', 'status'].includes(action)) throw Error(usage);
  let payload;
  if (action === 'status') {
    if (values.model !== undefined || !validId(input)) throw Error(usage);
    payload = {idWorks: [input]};
  } else {
    const model = values.model ?? 'pro';
    if (!['pro','lite'].includes(model)) throw Error('Choose pro or lite.');
    const url = URL.canParse(input) && new URL(input);
    if (!url || url.protocol !== 'https:' || url.username || url.password) throw Error('Use a direct HTTPS video URL without embedded credentials.');
    payload = {urls: [input], needChineseOcclude: model === 'pro' ? 1 : 2, videoInpaintLang: 'all',
      extraOptions: JSON.stringify({extra_inpaint_config: {model: model === 'pro' ? 'advanced_full' : 'advanced_lite'}})};
    if (model === 'lite') payload.videoInpaintMasks = JSON.stringify([{type:'remove_only_ocr', start:0, end:99999, region:[[0,0],[1,0],[1,1],[0,1]]}]);
    if (action === 'preview') return {state:'preview', model, area:'entire frame', sourceHost:url.hostname, billable:false};
  }
  const {WEYDUB_APP_KEY: key, WEYDUB_APP_SECRET: secret} = process.env;
  if (!key || !secret) throw Error('Set WEYDUB_APP_KEY and WEYDUB_APP_SECRET locally.');
  const body = JSON.stringify(payload);
  const response = await fetch(`https://api.zhaoli.com/v-w-c/gateway/ve/work/${action === 'status' ? 'status' : 'free'}`, {
    method:'POST', redirect:'error', signal:AbortSignal.timeout(45000),
    headers:{'Content-Type':'application/json', AppKey:key, AppSign:md5(md5(body) + secret)}, body,
  });
  if (!response.ok) throw Error(`Weydub returned HTTP ${response.status}.`);
  const result = await response.json();
  if (result.code !== 1000) throw Error(`Weydub business code ${Number(result.code)}.`);
  if (action === 'submit') {
    const id = result.body?.dataList?.[0]?.id;
    if (!validId(id)) throw Error('No confirmed work ID.');
    return {state:'accepted', jobId:String(id)};
  }
  const work = result.body?.content?.find(item => String(item.id) === input);
  if (!work || !Number.isInteger(work.processStatus)) throw Error('No matching job status for this account.');
  const status = work.processStatus;
  if (status === 1 && URL.canParse(work.videoUrl) && ['https:', 'http:'].includes(new URL(work.videoUrl).protocol))
    return {state:'ready', jobId:input, videoUrl:work.videoUrl};
  return {state:status <= 0 ? 'processing' : 'needs_attention', jobId:input, status};
}

try { console.log(JSON.stringify(await main())); }
catch (error) {
  console.error(error.message);
  if (process.argv[2] === 'submit') console.error('Do not retry automatically. Check your Weydub job history first.');
  process.exitCode = 1;
}
