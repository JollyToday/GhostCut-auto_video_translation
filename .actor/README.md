# Weydub Video and Image Localization

Turn the subtitles in a video into an SRT file, remove burned-in captions, dub spoken dialogue, or translate the text in a product image. This Actor uses your own [Weydub API account](https://weydub.com/docs/api/).

| Operation | Source | Result |
|---|---|---|
| Remove subtitles | Video with captions in the bottom 18% of the frame | Cleaned video using Lite removal |
| Extract subtitles | Video with visible text; select its language | Timed SRT from full-frame OCR |
| Translate and dub | Video with speech you have permission to process; select two languages | Dubbed video with translated captions; original burned-in text remains |
| Translate an image | Product photo, label or banner; select two languages | Image with translated text |

**Try a preview.** Leave the default image and keep **Submit a billable media job** off. Run the Actor and inspect `preview` in the dataset. This makes no Weydub API request. For a video, replace the sample image URL with your own video URL.

**Process one file.** Enter your Weydub credentials in the two secret fields, turn on submission and run once. Save the returned `jobId` and `nextOperation`. Submitting a second time creates another job. Weydub processing uses your own account's [credits and rates](https://weydub.com/vip/pricing-detail/); your Apify plan governs the Actor run.

**Download the result.** Start a new run, choose the returned status operation and replace the source URL with the numeric job ID. Use the same credentials. Open the result URL once the job completes. OCR returns a subtitle URL, not a video; image IDs use the image status operation. A batch workflow can store the ID alongside each source file and check it later.

[Subtitle removal](https://weydub.com/subtitle-removal/) · [Subtitle extraction](https://weydub.com/subtitle-generator/) · [Video translation](https://weydub.com/video-translator/) · [Image translation](https://weydub.com/image-translator/).
