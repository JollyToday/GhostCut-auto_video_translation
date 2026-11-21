const field = name => element.querySelector(`[data-${name}]`);
const clip = field('clip'), permission = field('permission'), receipt = field('receipt');
const send = field('send'), check = field('check'), copy = field('copy'), result = field('result');
const say = text => { field('message').textContent = text; };
const key = 'weydub.pro.receipt.v1', valid = value => /^[0-9a-f]{64}$/.test(value);
let busy = false;
try { receipt.value = sessionStorage.getItem(key) || ''; } catch {}
function refresh() {
  send.disabled = busy || !clip.files.length || !permission.checked || (!!receipt.value && !valid(receipt.value));
  check.disabled = busy || !valid(receipt.value);
  copy.disabled = !valid(receipt.value);
  receipt.disabled = clip.disabled = permission.disabled = busy;
}
function clearResult() { result.hidden = true; result.removeAttribute('href'); }
function remember() { try { sessionStorage.setItem(key, receipt.value); } catch {} }
const messages = {
  queued:'Your clip is queued. Check status with the same receipt.',
  submitting:'Your clip is being submitted. Check status shortly.',
  processing:'Weydub is removing text. Check status shortly.',
  ready:'Your cleaned clip is ready.',
  failed:'Processing failed. Keep the receipt for support.',
  needs_review:'This job needs review. Keep the receipt; do not submit it again.'
};
async function run(submit) {
  if (busy) return;
  clearResult();
  const file = clip.files[0];
  if (submit && (!file || !permission.checked)) return;
  if (submit && (file.size < 16 || file.size > 16777216)) return say('Choose a video up to 16 MiB.');
  if (submit && !receipt.value) {
    receipt.value = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
  }
  if (!valid(receipt.value)) return say('Paste the complete private receipt from your submission.');
  remember(); busy = true; refresh();
  say(submit ? 'Sending your clip…' : 'Checking this receipt…');
  const headers = {'X-Trial-Receipt': receipt.value};
  if (submit) Object.assign(headers, {'Content-Type':'video/mp4', 'X-Confirm-Upload':'yes'});
  try {
    const res = await fetch(new URL('sponsored-removal', document.baseURI), {
      method:submit?'POST':'GET', headers, body:submit?file:undefined, credentials:'omit',
      redirect:'error', cache:'no-store', signal:AbortSignal.timeout(90000)
    });
    const data = await res.json();
    if (!res.ok) return say(data.error || 'Could not confirm the result. Check status with this receipt.');
    if (data.state === 'ready') {
      if (!data.videoUrl) return say('Your clip is ready. Select Check status for the download link.');
      const url = new URL(data.videoUrl);
      if (url.protocol !== 'https:' || url.username || url.password) throw Error();
      result.href = url.href; result.hidden = false;
    }
    say(messages[data.state] || 'Unknown state. Keep the receipt for support.');
  } catch { say('Could not confirm the result. Check status with the same receipt before retrying.'); }
  finally { busy = false; refresh(); }
}
clip.addEventListener('change', () => { permission.checked = false; clearResult(); say(''); refresh(); });
permission.addEventListener('change', refresh);
receipt.addEventListener('input', () => { clearResult(); say(''); remember(); refresh(); });
send.addEventListener('click', () => run(true));
check.addEventListener('click', () => run(false));
copy.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(receipt.value); say('Receipt copied. Keep it private.'); }
  catch { receipt.focus(); receipt.select(); say('Copy the selected receipt and keep it private.'); }
});
if (valid(receipt.value)) say('A receipt is saved in this tab. Check status to resume.');
refresh();
