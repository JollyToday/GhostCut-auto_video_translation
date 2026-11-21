import {createHash} from 'node:crypto';

const md5 = text => createHash('md5').update(text).digest('hex');
function mediaUrl(value) {
  let url;
  try { url = new URL(value); } catch {}
  if (typeof value !== 'string' || !url || url.protocol !== 'https:' || url.username || url.password || /[\s\\]/.test(value)) {
    throw Error('Provide a direct HTTPS video URL without embedded credentials.');
  }
  return url;
}
export function preview(video) {
  return {state:'preview', source_host:mediaUrl(video).hostname, model:'Pro', region:'full frame', billable:false};
}
function jobId(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return null;
  return (typeof value === 'string' || typeof value === 'number') && /^[1-9]\d{0,19}$/.test(String(value)) ? String(value) : null;
}
export function service({key, secret, request = fetch}) {
  async function call(path, input) {
    if (!key || !secret) throw Error('Configure WEYDUB_APP_KEY and WEYDUB_APP_SECRET in your MCP client.');
    const body = JSON.stringify(input);
    let response;
    try {
      response = await request('https://api.zhaoli.com/v-w-c/gateway/ve/work/' + path, {
        method:'POST', redirect:'error', signal:AbortSignal.timeout(40000), body,
        headers:{'Content-Type':'application/json', AppKey:key, AppSign:md5(md5(body) + secret)}
      });
    } catch { throw Error('Weydub did not confirm the request.'); }
    if (!response.ok) throw Error(`Weydub returned HTTP ${response.status}.`);
    const data = await response.json().catch(() => null);
    if (data?.code !== 1000) throw Error(`Weydub did not accept the request (code ${Number.isInteger(data?.code) ? data.code : 'unknown'}).`);
    return data.body;
  }
  return {
    async submit(video, confirm) {
      if (confirm !== true) throw Error('Use preview_removal unless the owner has approved one billable job.');
      mediaUrl(video);
      try {
        const data = await call('free', {urls:[video], needChineseOcclude:1, videoInpaintLang:'all',
          extraOptions:JSON.stringify({extra_inpaint_config:{model:'advanced_full'}})});
        const id = jobId(data?.dataList?.[0]?.id);
        if (!id) throw Error('No work ID was returned.');
        return {state:'accepted', work_id:id};
      } catch (error) { throw Error(`${error.message} Check Weydub job history before submitting again.`); }
    },
    async status(id) {
      if (typeof id !== 'string' || !jobId(id)) throw Error('Use the numeric work ID from the submission.');
      const data = await call('status', {idWorks:[id]});
      const job = Array.isArray(data?.content) && data.content.find(row => jobId(row?.id) === id);
      if (!job || !Number.isInteger(job.processStatus)) throw Error('No matching job status. Use the original Weydub account.');
      if (job.processStatus < 1) return {state:'processing', work_id:id};
      if (job.processStatus !== 1) return {state:'failed', work_id:id, status_code:job.processStatus};
      const url = typeof job.videoUrl === 'string' ? job.videoUrl.replace(/^http:\/\//i,'https://') : '';
      try { mediaUrl(url); } catch {throw Error('The job is finished but its private download link is unavailable.');}
      return {state:'ready', work_id:id, download_url:url};
    }
  };
}
