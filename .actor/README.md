# Weydub Media Localization

Need the words from a video? Choose OCR to download timed subtitles. Need the words gone from the picture? Choose Lite removal to clean captions in the bottom 18% of the frame. On a paid Apify account you can process a file without a Weydub key. The Actor also supports Weydub account credits in runs outside Store billing.

| Operation | Source | Result |
|---|---|---|
| Remove subtitles | Video with captions in the bottom 18% of the frame | Cleaned video using Lite removal |
| Extract subtitles | Video with visible text; select its language | Timed SRT from full-frame OCR |
| Translate and dub | Video with speech you have permission to process; select two languages | Dubbed video with translated captions; original burned-in text remains |
| Translate an image | Product photo, label or banner; select two languages | Image with translated text |

**Try a preview.** Leave the default image and keep **Submit a billable media job** off. Run the Actor and inspect `preview` in the dataset. This makes no Weydub API request. For a video, replace the sample image URL with your own video URL.

## Pay through Apify: download from your original run

1. Leave both Weydub key fields empty. Choose one of the four processing operations above. Supply a direct HTTPS file link from Apify storage, Amazon S3, Alibaba OSS or the Weydub library. If your video is on your computer, upload it to your own storage first. A social post or a GitHub page is not a media link.
2. Enter a **Request key for Store billing**, for example `episode-17-ocr`, and turn on **Submit a billable media job**. Use that reference for just this file and operation. Store video input is one H.264 MP4 up to 60 seconds and 16 MiB.
3. Open the original run's **Storage → Key-value store** and download the `MEDIA` record. It contains the video, subtitle file or image itself. If the run stopped, check that same store for `MEDIA` before doing anything else. A new run cannot take over the first run's request key. The two job-ID lookup operations below are for Weydub account jobs.

See the [Actor's current pricing](https://apify.com/weydub/weydub-media-localization/pricing) for the completed-output events. A preview does not create a media job.

## Use Weydub credits: keep the job ID

For a run outside paid Apify Store billing, enter your [Weydub API credentials](https://weydub.com/docs/api/) in the two secret fields. Turn on submission and run once. Save the `jobId`; a second submission can spend credits again. See [Weydub account rates](https://weydub.com/vip/pricing-detail/).

**Get the file in this run.** Turn on **Wait for my download link** when submitting. Open the resulting dataset row: `sourceSubtitles` downloads the SRT, `video` opens a cleaned or dubbed MP4, and `output` opens the translated image. If the file is still processing when the Actor stops waiting, the row includes the original `jobId`.

**Check later.** Leave waiting off to return the job ID immediately. To retrieve an existing result, start a run with **Check a video or subtitle job** or **Check an image job**. Replace the source URL with the numeric job ID and use the same Weydub credentials. The dataset tells you what to do next:

| `state` | Next step |
|---|---|
| `processing` | Wait and check the same ID again. This does not create a job. |
| `ready` | Open `sourceSubtitles` for an OCR SRT, `video` for a cleaned or dubbed MP4, or `output` for a translated image. `files` lists the result fields available on this row. |
| `failed`, `unknown` or `missing-output` | Follow `nextAction`. Keep your job ID when asking for help. |

**Did a run stop before it showed your ID?** Open its default key-value store and look for `WEYDUB-SUBMISSION`. If it contains a `jobId`, use a status run to retrieve the result. If it says `submitting` with no ID, check your Weydub job history first. Starting a new processing run can spend credits twice.

[Subtitle removal](https://weydub.com/subtitle-removal/) · [Subtitle extraction](https://weydub.com/subtitle-generator/) · [Video translation](https://weydub.com/video-translator/) · [Image translation](https://weydub.com/image-translator/).
