# Weydub Media for n8n

On self-hosted n8n, install the versioned GitHub release in the `nodes` folder of your n8n user directory. Run these commands as the account that runs n8n (the default user directory is `~/.n8n`), then restart n8n:

```sh
mkdir -p ~/.n8n/nodes
npm install --prefix ~/.n8n/nodes --legacy-peer-deps --ignore-scripts https://github.com/JollyToday/GhostCut-auto_video_translation/releases/download/weydub-n8n-v0.1.3/n8n-nodes-weydub-0.1.3.tgz
```

Import [the OCR workflow](examples/preview-ocr.json) for burned-in captions or [the image workflow](examples/preview-image.json) for a Chinese product photo. Click **Execute workflow**. Both return a request preview without credentials or processing charges. For OCR, replace the example.org address with your own clip before live processing. The image example already contains a public sample from the Weydub API guide.

Use one input item per media file. Choose **Extract Full-Frame OCR Subtitles**, paste a downloadable video link and enter the language of the writing. Run the node with **Submit Billable Job** off to inspect the request. No credential is needed for a preview.

For live work, select your own **Weydub API** credential in n8n and turn on **Submit Billable Job**. The node returns a `jobId`. Save that ID, use a Wait node, then use **Get Video or OCR Result** with the same ID. At status `1`, `srtUrl` contains the timed subtitles; for erasure or dubbing use `videoUrl`. For images use **Get Image Result** and `outputUrl`. Do not resubmit to check progress. In a batch, branch on `state: error` to keep results for the other files.

To download a file from a job you already submitted, import the workflow for that job:

| Your job | Download workflow | Where the file appears |
| --- | --- | --- |
| Full-frame OCR | [Download timed subtitles](examples/download-subtitles.json) | Download subtitles → Binary → subtitles (SRT) |
| Lite erasure or speech dubbing | [Download a processed video](examples/download-video.json) | Download video → Binary → video (MP4) |
| Image translation | [Download a translated image](examples/download-image.json) | Download image → Binary → image |

Open the **Check … job** node, paste the saved job ID, select the same Weydub credential, then execute the workflow. If it stops at **Inspect job status**, check that node's output. For a pending job, check the same ID later. Video status `73` means there are insufficient credits to start; `83` means the result is locked: check your balance and keep the original ID. An image status above `1` means the translation failed. These download workflows never create another processing job.

**Started the job in Apify?** If you ran the [Weydub Actor](https://apify.com/weydub/weydub-media-localization) with your own Weydub credentials, copy the `jobId` from its dataset row, not the Apify run ID. Choose the matching workflow above and enter the same Weydub credentials in n8n. You can retrieve a completed, unlocked file even if that account has since used its last credit. Switching to a different Weydub account will not transfer the job.

Lite erasure targets the bottom 18% of the frame. Dubbing requires speech you may use; original burned-in text remains. Processing uses your Weydub credits. [API documentation](https://weydub.com/docs/api/) · [Rates](https://weydub.com/vip/pricing-detail/).
