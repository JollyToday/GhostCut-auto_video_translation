# Weydub Media nodes for ComfyUI

Install the `comfy` directory as `ComfyUI/custom_nodes/weydub_media` and restart ComfyUI. Look for **Weydub / Media**. These nodes call a media service, so no local GPU or model download is required.

Start with **Extract Subtitles (Full-Frame OCR)**. Paste a direct HTTPS video link and select the language of the writing. Leave **submit_billable_job** off and queue the graph to inspect the request. For live processing in your own private ComfyUI server, set `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` before launching it. People who can queue workflows on that server can use its credits. Keep keys out of workflow files.

Enable submission to create one job. Copy `job_id` into **Get Job Result**; choose `video` for erasure, OCR or dubbing, and `image` for a translated image. Queue the result node again later to refresh it. Status `1` means success. Use `srt_url` for OCR and `output_url` for rendered images or videos. Previewing a creation returns an empty job ID and does not submit anything.

Lite erasure targets the bottom 18% of the frame; OCR reads the entire frame. Dubbing adds translated captions without removing existing text. [Developer guide](https://weydub.com/docs/api/) · [Credit rates](https://weydub.com/vip/pricing-detail/).
