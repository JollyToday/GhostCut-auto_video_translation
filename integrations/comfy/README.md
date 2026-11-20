# Weydub Media nodes for ComfyUI

Install the `comfy` directory as `ComfyUI/custom_nodes/weydub_media` and restart ComfyUI. Look for **Weydub / Media**. These nodes call a media service, so no local GPU or model download is required.

Start with **Extract Subtitles (Full-Frame OCR)**. Paste a direct HTTPS video link and select the language of the writing. Leave **submit_billable_job** off and queue the graph to inspect the request. For live processing in your own private ComfyUI server, set `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` before launching it. People who can queue workflows on that server can use its credits. Keep keys out of workflow files.

Enable submission to create one job. Connect `job_id` to ComfyUI's **Preview as Text** to copy it. In a separate workflow, paste that ID into **Get Job Result**; choose `video` for erasure, OCR or dubbing, and `image` for a translated image. You can queue this second workflow as often as needed without submitting the source again. If the first request times out before you receive an ID, check your job history in Weydub before trying again.

Connect **Preview as Text** to `srt_url` for OCR or `output_url` for an image or dubbed/cleaned video. A link is returned only when the job has succeeded and a downloadable URL is available. The `status` socket keeps the original code for automation: below `1` means still processing; `1` means completed; video code `83` means check the balance for this job. If the job is complete but the result link is empty, contact Weydub with that ID. Previewing a creation returns an empty job ID and does not submit anything.

Lite erasure targets the bottom 18% of the frame; OCR reads the entire frame. Dubbing adds translated captions without removing existing text. [Developer guide](https://weydub.com/docs/api/) · [Credit rates](https://weydub.com/vip/pricing-detail/).
