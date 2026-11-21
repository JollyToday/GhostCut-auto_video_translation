# Remove burned-in subtitles with Node-RED

Have a supplier video with captions baked into the picture? Try one local clip with the free flow below, or use your Weydub account to process a video by URL. Both return a private MP4 download link.

**Before spending credits:** compare the [original frames](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) with [the cleaned frames](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp). Full-frame removal can also affect signs, logos or prices. To keep those and remove only a caption band, use [the area selector in Weydub](https://weydub.com/subtitle-removal/).

## Try a local MP4 for free

1. Download the [free Node-RED flow JSON](https://raw.githubusercontent.com/JollyToday/GhostCut-auto_video_translation/main/examples/node-red/free-pro-subtitle-removal.json). In a trusted Node-RED editor, select **Menu → Import → select a file to import**. The flow uses core nodes and Node's built-in modules; your instance must permit Function node modules. No Weydub key or npm install is required.
2. Put your MP4 in a private, writable folder **on the Node-RED host**. For Docker, use a path inside a persistent mounted folder. Double-click the new flow tab and under **Environment Variables** set `WEYDUB_TRIAL_FILE` to the full file path. Use H.264, up to 60 seconds and 16 MiB, with optional AAC audio. Need a clip? [Download the licensed 15-second example](../full-frame-removal/).
3. **Deploy**, open **Debug**, then click **Upload my authorized MP4** to send it to Weydub. Deploying alone sends nothing. Click **Check status / get MP4**; once ready, open `download_url` and save the file. The result link and the `.weydub-receipt` saved beside your clip are private. Keep the receipt and file path to resume after a restart. Repeating an upload with the same receipt and identical bytes reuses the same job.

Anonymous channels share 100 sponsored submissions per UTC month. When capacity is unavailable the flow stops without charging you. For a different clip, use a different filename; keep earlier receipts until you've downloaded their results.

## Use your own Weydub account

Need a test URL? The [three-position sample](../full-frame-removal/) includes a direct MP4 link for `WEYDUB_VIDEO_URL` and the actual processed file for comparison.

1. On your own Node-RED instance, set `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` in the service environment. Get these from your [Weydub API account](https://weydub.com/docs/api/). Set `WEYDUB_VIDEO_URL` to a direct HTTPS link to a video you have permission to process. A link to a social post will not work. Keep signed URLs and credentials out of exported flows.
2. Add `weydubCrypto: require('node:crypto')` inside the existing `functionGlobalContext` object in your Node-RED `settings.js`, then restart Node-RED. This uses Node's built-in crypto library to sign requests. Allow outbound HTTPS to `api.zhaoli.com`, the processing API used by Weydub. Only trusted people should have access to this editor.
3. Download [the flow JSON](pro-subtitle-removal.json). Open **Menu → Import → select a file to import**, choose the file, then **Import → Deploy**. Deployment alone does not start a job.

## Clean a clip and download it

1. Open the **Debug** sidebar, then click the button next to **Submit one video (uses credits)**. When the state is `accepted`, copy the `work_id`. Each new job uses your Weydub credits at your [account rate](https://weydub.com/vip/pricing-detail/).
2. Click **Check status (latest or saved ID)**. If the result says `processing`, check again in a few minutes. When it says `ready`, open `download_url` and save the MP4. The link is private; anyone who has it may be able to download the video.
3. After a restart, or to revisit an older video, edit the **Check status** inject node: set its string payload to the saved work ID, deploy, then click it. It must be a job belonging to the connected account.

The flow remembers the most recent submission in Node-RED's flow context. An immediate second click for the same URL returns the saved ID or asks you to check your history. Context may be cleared across restarts, and a refreshed signed URL counts as a different URL. If a submission times out or the editor closes before you see an ID, check your Weydub job history before submitting again. Use **Check status** with the ID you find. Once you have reconciled the job, clear the `lastSubmission` entry in the flow's context to unlock new submissions if needed. Status checks never create a new removal job.
