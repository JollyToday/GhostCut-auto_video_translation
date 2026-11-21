# Remove burned-in subtitles with Node-RED

Have a supplier video with captions baked into the picture? This flow submits a full-frame Pro removal and returns a private MP4 download link. It uses core Node-RED nodes and your Weydub API account. No LLM, community node or paid Node-RED subscription is required.

**Before spending credits:** compare the [original frames](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) with [the cleaned frames](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp). Full-frame removal can also affect signs, logos or prices. To keep those and remove only a caption band, use [the area selector in Weydub](https://weydub.com/subtitle-removal/).

## Set up once

Need a test URL? The [three-position sample](../full-frame-removal/) includes a direct MP4 link for `WEYDUB_VIDEO_URL` and the actual processed file for comparison.

1. On your own Node-RED instance, set `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` in the service environment. Get these from your [Weydub API account](https://weydub.com/docs/api/). Set `WEYDUB_VIDEO_URL` to a direct HTTPS link to a video you have permission to process. A link to a social post will not work. Keep signed URLs and credentials out of exported flows.
2. Add `weydubCrypto: require('node:crypto')` inside the existing `functionGlobalContext` object in your Node-RED `settings.js`, then restart Node-RED. This uses Node's built-in crypto library to sign requests. Allow outbound HTTPS to `api.zhaoli.com`, the processing API used by Weydub. Only trusted people should have access to this editor.
3. Download [the flow JSON](pro-subtitle-removal.json). Open **Menu → Import → select a file to import**, choose the file, then **Import → Deploy**. Deployment alone does not start a job.

## Clean a clip and download it

1. Open the **Debug** sidebar, then click the button next to **Submit one video (uses credits)**. When the state is `accepted`, copy the `work_id`. Each new job uses your Weydub credits at your [account rate](https://weydub.com/vip/pricing-detail/).
2. Click **Check status (latest or saved ID)**. If the result says `processing`, check again in a few minutes. When it says `ready`, open `download_url` and save the MP4. The link is private; anyone who has it may be able to download the video.
3. After a restart, or to revisit an older video, edit the **Check status** inject node: set its string payload to the saved work ID, deploy, then click it. It must be a job belonging to the connected account.

The flow remembers the most recent submission in Node-RED's flow context. An immediate second click for the same URL returns the saved ID or asks you to check your history. Context may be cleared across restarts, and a refreshed signed URL counts as a different URL. If a submission times out or the editor closes before you see an ID, check your Weydub job history before submitting again. Use **Check status** with the ID you find. Once you have reconciled the job, clear the `lastSubmission` entry in the flow's context to unlock new submissions if needed. Status checks never create a new removal job.
