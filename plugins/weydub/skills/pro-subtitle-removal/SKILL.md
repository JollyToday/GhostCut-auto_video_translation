---
name: pro-subtitle-removal
description: Remove burned-in subtitles from a video with Weydub, or retrieve the cleaned video from a previously submitted Weydub work ID. Use for captions embedded in the picture, not a removable subtitle track.
---

Use Node.js 20+ and `scripts/remove.mjs` relative to this skill's directory. The default is Pro. Both Pro and Lite scan the entire frame without asking the user to draw boxes. Other visible writing, including signs and product labels, can also be removed. When those must stay, point the user to [Weydub's browser workflow](https://weydub.com/subtitle-removal/) to select a region instead.

1. Start with a direct HTTPS media file the user has permission to process. `node scripts/remove.mjs preview 'HTTPS_MEDIA_URL'` validates the input and describes the request locally, without credentials, fetching media or creating a job. Use `--model lite` only when the user prefers Lite.
2. A live submission sends the URL to Weydub and spends the user's own Weydub credits. Confirm the clip and model before spending. Use `node scripts/remove.mjs submit 'HTTPS_MEDIA_URL'` (append `--model lite` for Lite). Read `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` from the local environment; never request credentials in chat. A successful submission returns a `jobId`, not a finished video.
3. Use `node scripts/remove.mjs status JOB_ID` from the same account. When `state` is `ready`, give the user the private `videoUrl`. When `processing`, keep the ID and check again later. For other states, report the status without starting another job. If submission times out without an ID, check the user's Weydub job history before considering another submission.

[API guide](https://weydub.com/docs/api/) · [Account credit rates](https://weydub.com/vip/pricing-detail/).
