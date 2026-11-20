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

**Get the file in this run.** Turn on **Wait for my download link** when submitting. Open the resulting dataset row: `sourceSubtitles` downloads the SRT, `video` opens a cleaned or dubbed MP4, and `output` opens the translated image. Waiting uses Apify runtime. If the file is still processing when the Actor stops waiting, the row includes the original `jobId`.

**Check later.** Leave waiting off to return the job ID immediately. To retrieve an existing result, start a run with **Check a video or subtitle job** or **Check an image job**. Replace the source URL with the numeric job ID and use the same Weydub credentials. The dataset tells you what to do next:

| `state` | Next step |
|---|---|
| `processing` | Wait and check the same ID again. This does not create a job. |
| `ready` | Open `sourceSubtitles` for an OCR SRT, `video` for a cleaned or dubbed MP4, or `output` for a translated image. `files` lists the result fields available on this row. |
| `failed`, `unknown` or `missing-output` | Follow `nextAction`. Keep your job ID when asking for help. |

**Did a run stop before it showed your ID?** Open its default key-value store and look for `WEYDUB-SUBMISSION`. If it contains a `jobId`, use a status run to retrieve the result. If it says `submitting` with no ID, check your Weydub job history first. Starting a new processing run can spend credits twice.

[Subtitle removal](https://weydub.com/subtitle-removal/) · [Subtitle extraction](https://weydub.com/subtitle-generator/) · [Video translation](https://weydub.com/video-translator/) · [Image translation](https://weydub.com/image-translator/).
