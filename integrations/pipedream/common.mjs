import { createHash } from "node:crypto";
import app from "./weydub.app.mjs";
import contract from "./contract.mjs";

const docs = "[See the documentation](https://weydub.com/docs/api/)";
const labels = {
  erase: ["remove-video-text", "Remove Burned-In Subtitles", "Clean text in the bottom 18% of the frame using the Lite removal model."],
  ocr: ["extract-subtitles", "Extract Full-Frame OCR Subtitles", "Read visible subtitles across the frame and return a job for a timed SRT."],
  dub: ["dub-video", "Translate and Dub Video", "Translate authorized speech and create a dubbed video using the high-emotion voice model."],
  image: ["translate-image", "Translate Image Text", "Render translated text back into a product image or poster."],
  "video-status": ["get-video-result", "Get Video or OCR Result", "Look up a work ID to retrieve a cleaned video, dubbed video or timed subtitles."],
  "image-status": ["get-image-result", "Get Image Result", "Look up an image job ID to retrieve the translated image."],
};
const md5 = (text) => createHash("md5").update(text).digest("hex");
const lang = (value) => {
  if (!/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$/.test(value ?? "")) throw Error("Enter a language code, such as en.");
  return value;
};
function jobId(value) {
  if (!["number", "string"].includes(typeof value) || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw Error("Expected a positive job ID. Check the original submission before trying again.");
  }
  return String(value);
}
function media(value) {
  let url;
  try { url = new URL(value); } catch { /* Report a helpful field error below. */ }
  if (!url || url.protocol !== "https:" || url.username || url.password) throw Error("Use a downloadable HTTPS file URL without embedded credentials.");
  return value;
}
function makeBody(op, props) {
  const body = structuredClone(contract[op].body);
  if (op === "image-status") body.id = Number(jobId(props.jobId));
  else if (op === "video-status") body.idWorks = [jobId(props.jobId)];
  else if (op === "image") Object.assign(body, { srcLang: lang(props.source), tgtLang: lang(props.target), downloadInfo: JSON.stringify({ url: media(props.mediaUrl) }) });
  else {
    body.urls = [media(props.mediaUrl)];
    if (op === "ocr") body.lang = body.videoInpaintLang = lang(props.source);
    if (op === "dub") Object.assign(body, { sourceLang: lang(props.source), lang: lang(props.target) });
  }
  return body;
}
function unpack(op, props, reply) {
  if (reply?.code !== 1000) throw Error(reply?.code === 4005 ? "Insufficient Weydub processing credits (4005)." : `Weydub code ${reply?.code ?? "unknown"}. Check existing jobs before resubmitting.`);
  const b = reply.body;
  if (op === "image-status") {
    if (String(b?.id) !== jobId(props.jobId) || !Number.isInteger(b?.status)) {
      throw Error("No matching image job for this connection. For a video or SRT, use Get Video or OCR Result with the original job ID.");
    }
    const value = b.status === 1 && b.result ? (typeof b.result === "string" ? JSON.parse(b.result) : b.result) : null;
    if (b.status === 1 && !value?.output_url) throw Error("The image job is marked complete without a translated image. Keep the job ID for support; do not submit it again.");
    return { jobId: jobId(props.jobId), status: b.status, imageUrl: value?.output_url || null, cleanBackgroundUrl: value?.inpaint_url || null };
  }
  if (op === "video-status") {
    const id = jobId(props.jobId);
    const item = b?.content?.find((work) => String(work.id) === id);
    if (!item || !Number.isInteger(item.processStatus)) throw Error("No matching work found for this account.");
    const ready = item.processStatus === 1;
    const creditMessage = {
      73: "Processing has not started. Check the connected Weydub account's processing credits before retrying.",
      83: "Processing finished but the output is locked. Resolve the balance on the connected Weydub account and check this job again; do not create a new one.",
    }[item.processStatus];
    return { jobId: id, status: item.processStatus, ...(creditMessage && {statusMessage: creditMessage}), videoUrl: ready && item.videoUrl || null, sourceSrtUrl: ready && item.srcSrtUrl || null, translatedSrtUrl: ready && item.tgtSrtUrl || null };
  }
  return { state: "accepted", jobId: jobId(op === "image" ? b : b?.dataList?.[0]?.id), nextAction: op === "image" ? "weydub-get-image-result" : "weydub-get-video-result" };
}
export function action(op) {
  const [slug, name, description] = labels[op];
  const lookup = op.endsWith("-status");
  const props = { weydub: app };
  if (lookup) props.jobId = { type: "string", label: "Job ID", description: "Use the jobId returned by the create action. It is not an account UID." };
  else {
    props.mediaUrl = { type: "string", label: op === "image" ? "Image URL" : "Video URL", description: "Direct HTTPS link to a file you have permission to process." };
    if (op !== "erase") props.source = { type: "string", label: op === "dub" ? "Spoken Language" : "Visible Text Language", description: "Language code of the source, for example zh or en." };
    if (["dub", "image"].includes(op)) props.target = { type: "string", label: "Target Language", description: "Language code of the output, for example en." };
    props.submit = { type: "boolean", label: "Submit Billable Job", description: "Leave off to preview. Turn on to spend this connected account's processing credits on one file.", default: false };
  }
  return {
    key: `weydub-${slug}`, name, description: `${description} ${docs}`, type: "action", version: "0.0.1", props,
    async run({ $ }) {
      const body = makeBody(op, this);
      if (!lookup && this.submit !== true) {
        $.export("$summary", "Preview only. No job was submitted.");
        return { state: "preview", action: slug };
      }
      const { app_key: key, app_secret: secret } = this.weydub?.$auth ?? {};
      if (!key || !secret) throw Error("Connect your own Weydub API account.");
      const wire = JSON.stringify(body);
      let response;
      try {
        response = await fetch(`https://api.zhaoli.com${contract[op].path}`, {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(45000), body: wire,
          headers: { "Content-Type": "application/json", AppKey: key, AppSign: md5(md5(wire) + secret) },
        });
      } catch {
        throw Error("Weydub did not confirm the request. Check your task list before repeating a submission.");
      }
      if (!response.ok) throw Error(`Weydub returned HTTP ${response.status}. Check the job before resubmitting.`);
      const out = unpack(op, this, await response.json());
      $.export("$summary", lookup ? `Job ${out.jobId}: status ${out.status}.${out.statusMessage ? ` ${out.statusMessage}` : ""}` : `Submitted job ${out.jobId}. Save this ID to check the result.`);
      return out;
    },
  };
}
