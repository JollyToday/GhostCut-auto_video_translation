# Weydub Media for n8n

On self-hosted n8n, install the node package in your user directory's `nodes` folder and restart n8n. Import [the two-node OCR workflow](examples/preview-ocr.json) to try a preview. Replace the example.org address before creating a live job.

Use one input item per media file. Choose **Extract Full-Frame OCR Subtitles**, paste a downloadable video link and enter the language of the writing. Run the node with **Submit Billable Job** off to inspect the request. No credential is needed for a preview.

For live work, select your own **Weydub API** credential in n8n and turn on **Submit Billable Job**. The node returns a `jobId`. Save that ID, use a Wait node, then use **Get Video or OCR Result** with the same ID. At status `1`, `srtUrl` contains the timed subtitles; for erasure or dubbing use `videoUrl`. For images use **Get Image Result** and `outputUrl`. Do not resubmit to check progress. In a batch, branch on `state: error` to keep results for the other files.

Lite erasure targets the bottom 18% of the frame. Dubbing requires speech you may use; original burned-in text remains. Processing uses your Weydub credits. [API documentation](https://weydub.com/docs/api/) · [Rates](https://weydub.com/vip/pricing-detail/).
