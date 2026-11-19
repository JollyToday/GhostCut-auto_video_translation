import {pathToFileURL} from 'node:url';

// A key is sent only to the host of the selected marketplace product.
const products = {
  image: 'image-translation',
  remove: 'auto-video-watermark-or-subtitles-remove',
  dub: 'video-translation',
  edit: 'video-reproduction-or-de-duplication1',
};
export async function lookup(product, input, key, request = fetch) {
  if (!Object.hasOwn(products, product) || !/^[1-9]\d*$/.test(input) || !Number.isSafeInteger(Number(input))) {
    throw Error('Usage: node examples/rapidapi-result.mjs image|remove|dub|edit JOB_ID');
  }
  if (!key?.trim()) throw Error('Set RAPIDAPI_KEY in your local environment.');
  const id = Number(input);
  const image = product === 'image';
  const host = `${products[product]}.p.rapidapi.com`;
  const res = await request(`https://${host}${image ? '/image/translate/query' : '/work/status'}`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: {'content-type': 'application/json', 'x-rapidapi-host': host, 'x-rapidapi-key': key},
    body: JSON.stringify(image ? {id} : {idWorks: [id]}),
  });
  if (!res.ok) throw Error(`HTTP ${res.status}: check this listing's subscription and request quota.`);
  const {code, msg, trace, body} = await res.json();
  if (code !== 1000) return {state: 'api_error', code, msg, trace};
  const item = image ? body : body?.content?.find(work => String(work.id) === String(id));
  if (!item || (image && item.id != null && String(item.id) !== String(id))) return {state: 'no_match', id, trace};
  const raw = image ? item.status : item.processStatus;
  if (!Number.isInteger(raw)) return {state: 'unknown_status', id, trace};
  if (raw !== 1) return {state: raw > 1 ? 'needs_attention' : 'not_ready', id, status: raw, trace};
  let url;
  if (image) {
    const result = typeof item.result === 'string' ? JSON.parse(item.result) : item.result;
    url = result?.output_url;
  } else url = item.videoUrl;
  if (!url || !/^https?:\/\//i.test(url)) return {state: 'missing_output', id, trace};
  return {state: 'ready', id, url};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await lookup(process.argv[2], process.argv[3], process.env.RAPIDAPI_KEY);
    console.log(JSON.stringify(result, null, 2));
    if (!['ready', 'not_ready'].includes(result.state)) process.exitCode = 1;
  } catch (e) {
    console.error(e instanceof SyntaxError ? 'The result was not valid JSON. Keep your job ID and contact the provider.' : e.message);
    process.exitCode = 1;
  }
}
