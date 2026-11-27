const endpoint = 'https://iniu-weydub-media-localization.hf.space/gradio_api/sponsored-removal';
const storageKey = 'weydub.pro.receipt.v1';
const el = id => document.getElementById(id);
const valid = text => /^[0-9a-f]{64}$/.test(text);
let busy = false, available = false;
const states = {
  queued: 'Your clip is queued.', submitting: 'Your clip is being submitted.',
  processing: 'Weydub is removing the text.', ready: 'Your cleaned clip is ready.',
  failed: 'Processing failed. Keep the receipt for support.',
  needs_review: 'This clip needs review. Keep the receipt; do not resubmit.',
  expired: 'This result has expired.'
};
function show(text) { el('status').textContent = text; }
function clearResult() { el('download').hidden = true; el('download').removeAttribute('href'); }
function update() {
  const receipt = el('receipt').value;
  el('submit').disabled = busy || !available || !el('clip').files.length || !el('consent').checked || (!!receipt && !valid(receipt));
  el('check').disabled = busy || !available || !valid(receipt);
  el('copy').disabled = !valid(receipt);
  el('fresh').disabled = busy || !valid(receipt);
  for (const id of ['clip','consent','receipt']) el(id).disabled = busy;
}
function remember() {
  try { sessionStorage.setItem(storageKey, el('receipt').value); } catch {}
}
function request(method,receipt,body) {
  const headers = {'X-Trial-Receipt':receipt};
  if (body) { headers['Content-Type'] = 'video/mp4'; headers['X-Confirm-Upload'] = 'yes'; }
  return fetch(endpoint,{method,headers,body,credentials:'omit',redirect:'error',cache:'no-store',
    referrerPolicy:'no-referrer',signal:AbortSignal.timeout(body ? 90000 : 15000)});
}
async function connect() {
  // An invalid lookup checks that this browser can read the actual gateway. It cannot reserve a clip.
  try {
    const res = await request('GET','invalid');
    available = res.status === 400 && typeof (await res.json()).error === 'string';
  } catch { available = false; }
  el('alternate').hidden = available;
  if (!available) show('This browser cannot reach the trial here.');
  else if (valid(el('receipt').value)) show('A receipt is saved in this tab. Check status to resume.');
  update();
}
async function run(submit) {
  if (busy || !available) return;
  const file = el('clip').files[0], input = el('receipt');
  if (submit) {
    if (!file || !el('consent').checked) return;
    if (!/\.mp4$/i.test(file.name) || file.size < 16 || file.size > 16*1024*1024)
      return show('Choose an MP4 file no larger than 16 MiB.');
    if (!input.value) input.value = Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  }
  if (!valid(input.value)) return;
  clearResult(); remember(); busy = true; el('resume').open = true; update();
  show(submit ? 'Uploading your clip...' : 'Checking your receipt...');
  try {
    const res = await request(submit?'POST':'GET',input.value,submit?file:undefined);
    const data = await res.json();
    if (!res.ok) {
      const error = {404:'No job was found for this receipt.',409:'This receipt belongs to another clip. Keep it for the original job.',
        413:'The file exceeds 16 MiB.',415:'Choose an H.264 MP4 with optional AAC audio.',
        422:'This file does not meet the format or 60-second limit.',429:'Trial capacity is unavailable. No paid job was started.'};
      return show(error[res.status] || 'Weydub could not confirm the request. Keep the receipt and check again.');
    }
    if (!Object.hasOwn(states,data.state)) throw Error();
    if (data.state === 'ready' && data.videoUrl) {
      const url = new URL(data.videoUrl);
      if (url.origin !== 'https://gc70.cdn.izhaoli.cn' || url.username || url.password) throw Error();
      el('download').href=url.href; el('download').hidden=false;
    } else if (data.state === 'ready') return show('Your clip is ready. Check status for the download link.');
    show(states[data.state] + (['queued','submitting','processing'].includes(data.state) ? ' Check status with the same receipt.' : ''));
  } catch {show('Could not confirm the result. Keep your receipt and check status before retrying.');}
  finally {busy=false;update();}
}
try {el('receipt').value=sessionStorage.getItem(storageKey)||'';} catch {}
el('resume').open=valid(el('receipt').value);
el('submit').onclick=()=>run(true); el('check').onclick=()=>run(false);
el('consent').onchange=update;
el('clip').onchange=()=>{el('consent').checked=false;clearResult();update();};
el('receipt').oninput=()=>{clearResult();remember();update();};
el('fresh').onclick=()=>{
  if (!window.confirm('Have you saved the current receipt? Starting another clip clears it from this tab.')) return;
  el('receipt').value='';el('clip').value='';el('consent').checked=false;el('receipt').type='password';
  clearResult();remember();show('Choose the next clip.');el('resume').open=false;update();el('clip').focus();
};
el('copy').onclick=async()=>{
  try {await navigator.clipboard.writeText(el('receipt').value);show('Receipt copied. Keep it private.');}
  catch {el('receipt').type='text';el('receipt').focus();el('receipt').select();show('Copy the selected receipt and keep it private.');}
};
update();connect();
