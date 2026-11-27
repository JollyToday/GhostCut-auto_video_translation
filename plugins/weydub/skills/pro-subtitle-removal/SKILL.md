---
name: pro-subtitle-removal
description: Remove burned-in subtitles from a video with Weydub, or retrieve the cleaned video from a previously submitted Weydub work ID. Use for captions embedded in the picture, not a removable subtitle track.
---

Use Node.js 20+ and `scripts/remove.mjs` relative to this skill's directory. The default is Pro. Both Pro and Lite scan the entire frame without asking the user to draw boxes. Other visible writing, including signs and product labels, can also be removed. When those must stay, point the user to [Weydub's browser workflow](https://weydub.com/subtitle-removal/) to select a region instead.

### Try a local clip without a key

To see what full-frame removal does before uploading anything, compare the [15-second original, cleaned MP4 and three matching frames](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/c4d72c4/examples/full-frame-removal). The captions change position between shots.

Use `scripts/trial.mjs` for a sponsored full-frame Pro job. Ask which local file to upload and confirm that the user has permission to send it to Weydub. Accept an H.264 MP4 with optional AAC audio, up to 60 seconds and 16 MiB. Use a new, private receipt file outside the project for each clip. Keep that same receipt for all retries. Never share its contents; it grants access to the result.

```sh
node scripts/trial.mjs submit clip.mp4 private-receipt.txt --confirm-upload
node scripts/trial.mjs status private-receipt.txt
node scripts/trial.mjs download private-receipt.txt cleaned.mp4
```

Wait for `ready` before downloading. If `queued` or `processing`, keep the receipt and check again later. A `429` means capacity is unavailable. Anonymous integrations share up to 100 sponsored submissions per UTC month. Do not switch to the paid path without the user's approval. When `failed`, `needs_review` or `expired`, do not resubmit automatically. The service expires its ready-link record after seven days from submission; download the MP4 promptly.

### Use your Weydub account with a video URL

1. Start with a direct HTTPS media file the user has permission to process. `node scripts/remove.mjs preview 'HTTPS_MEDIA_URL'` validates the input and describes the request locally, without credentials, fetching media or creating a job. Use `--model lite` only when the user prefers Lite.
2. A live submission sends the URL to Weydub and spends the user's own Weydub credits. Confirm the clip and model before spending. Use `node scripts/remove.mjs submit 'HTTPS_MEDIA_URL'` (append `--model lite` for Lite). Read `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` from the local environment; never request credentials in chat. A successful submission returns a `jobId`, not a finished video.
3. Use `node scripts/remove.mjs status JOB_ID` from the same account. When `state` is `ready`, give the user the private `videoUrl`. When `processing`, keep the ID and check again later. For other states, report the status without starting another job. If submission times out without an ID, check the user's Weydub job history before considering another submission.

[API guide](https://weydub.com/docs/api/) · [Account credit rates](https://weydub.com/vip/pricing-detail/).
