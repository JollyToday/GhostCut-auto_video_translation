import {pathToFileURL} from 'node:url';

const sampleImage = 'https://gc100.cdn.izhaoli.cn/ve_material_image/A-00b4943646344cfc/e2d6dd82903f4059bd94c9b660f5f7b6/1782789120948.webp';
const products = {
  image: ['image-translation', '/image/translate', url => ({srcLang:'zh', synthesisOn:1, tgtLang:'en', translateOn:1, downloadInfo:JSON.stringify({url}), callback:''})],
  remove: ['auto-video-watermark-or-subtitles-remove', '/work/fast', url => ({urls:[url], needChineseOcclude:1, videoInpaintLang:'zh', callback:''})],
  dub: ['video-translation', '/work/translationPro', url => ({urls:[url], sourceLang:'cn', lang:'en', voice:3, removeBgAudio:'0', needText:0, callback:''})],
  edit: ['video-reproduction-or-de-duplication1', '/work/fast', url => ({urls:[url], needTrim:0, needMask:0, needMirror:1, needRescale:0, needTransition:0, needShift:0, randomBorder:0, resolution:2, callback:''})],
};
const usage = 'Usage: node examples/rapidapi-first-job.mjs image|remove|dub|edit [--submit]. Set MEDIA_URL for a video or your own product image.';
const positiveId = v => Number.isSafeInteger(v) && v > 0;

// Only include support identifiers and numeric meter readings, never keys or media URLs.
function failureReceipt(response, slug, path, trace) {
  const safeId = v => typeof v === 'string' && /^[A-Za-z0-9._:-]{1,160}$/.test(v) ? v : undefined;
  const meters = {};
  for (const [name, value] of response.headers) {
    if (/^x-ratelimit-(?:requests|advanced|video[-_]?tasks?)-(?:limit|remaining)$/.test(name) && /^\d{1,16}$/.test(value)) meters[name] = value;
  }
  return {listing:slug, endpoint:path, httpStatus:response.status, trace:safeId(trace),
    rapidapiRequestId:safeId(response.headers.get('x-rapidapi-request-id')), meters};
}

export async function firstJob(args, env = {}, request = fetch) {
  const [op, flag] = args;
  if (!Object.hasOwn(products, op) || args.length > 2 || (flag !== undefined && flag !== '--submit')) throw Error(usage);
  const [slug, path, payload] = products[op];
  const input = env.MEDIA_URL || (op === 'image' ? sampleImage : '');
  if (!URL.canParse(input) || new URL(input).protocol !== 'https:' || new URL(input).username || new URL(input).password) {
    throw Error('Set MEDIA_URL to an HTTPS media file you can use. Do not include a username or password.');
  }
  const host = `${slug}.p.rapidapi.com`;
  const url = `https://${host}${path}`;
  const body = payload(input);
  if (op === 'dub' && env.DUB_CAPTIONS !== undefined) {
    if (!['0','1'].includes(env.DUB_CAPTIONS)) throw Error('Set DUB_CAPTIONS to 0 (voice only) or 1 (voice and translated captions).');
    body.needText = Number(env.DUB_CAPTIONS);
  }
  if (!flag) return {state:'preview', method:'POST', url, body};
  if (!env.RAPIDAPI_KEY?.trim()) throw Error('Set RAPIDAPI_KEY locally, then submit once.');
  let response, result;
  try {
    response = await request(url, {
      method:'POST', redirect:'error', signal:AbortSignal.timeout(30000),
      headers:{'content-type':'application/json','x-rapidapi-host':host,'x-rapidapi-key':env.RAPIDAPI_KEY},
      body:JSON.stringify(body),
    });
    if (!response.ok) return {state:'check_request', ...failureReceipt(response,slug,path), advice:'Check the original request in RapidAPI before submitting again.'};
    result = await response.json();
  } catch {
    throw Error('No readable response. The job may already exist. Check your request history or contact the provider before submitting again.');
  }
  const {code, trace} = result ?? {};
  if (code !== 1000) return {state:'check_request', code, ...failureReceipt(response,slug,path,trace), advice:code === 4005 ? 'Processing credit check failed. Stop here: another call may use more marketplace quota. Send this receipt privately to the provider to check the subscription mapping and meter history. Do not upgrade or poll.' : 'Check the original request with the provider before submitting again.'};
  const jobId = op === 'image' ? result.body : result.body?.dataList?.[0]?.id;
  if (positiveId(jobId)) return {state:'accepted', jobId, next:`node examples/rapidapi-result.mjs ${op} ${jobId}`};
  const projectId = result.body?.idProject;
  if (op !== 'image' && positiveId(projectId)) return {state:'accepted', projectId, next:{endpoint:'Get Result',body:{idProjects:[projectId]}}};
  return {state:'check_request', code, trace, advice:'No usable job ID was returned. Contact the provider before submitting again.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await firstJob(process.argv.slice(2),process.env);
    console.log(JSON.stringify(result,null,2));
    if (result.state === 'check_request') process.exitCode = 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
