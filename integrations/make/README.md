# Weydub modules for Make

[Install Weydub in Make](https://www.make.com/en/hq/app-invitation/a4e2ee19d928e181b5dbbbd59c10a8ed). On the invitation page select **Install**, choose your Make organization, and add a Weydub module to a scenario. This is the provider's published custom app, available by invitation link. It is not yet listed in Make's reviewed app directory. For an integration without Make, use the [direct API](https://weydub.com/docs/api/).

Four actions submit a single file: remove lower-frame burned-in captions with Lite, extract visible subtitles with full-frame OCR, translate and dub speech, or translate text inside an image. For OCR, enter the language you see on screen. For dubbing, choose the language you hear and the language you want to deliver. Supply a directly downloadable HTTPS file you have permission to process.

## Try dubbing with a sample

Download the two JSON blueprints below (use **Download raw file** on GitHub). After installing the app, create a **new blank scenario for each file**. In the scenario editor open **More → Import blueprint**. Choose your own Weydub connection in the imported module, save, and leave scheduling off.

1. [Dub a Chinese clip in English](blueprints/dub-creator-clip.json) starts with the [Pocket Light sample](https://weydub.com/creator-kit/clips/pocket-light/zh.mp4), spoken language `zh` and target `en`. Click **Run once** with **Submit billable job** set to **No**: the module should return `preview` without submitting a video to Weydub. To produce one English dub, change it to **Yes**, run **once** and keep the **Job ID**.
2. [Download the dubbed clip](blueprints/check-dubbed-clip.json) uses **Get a Video or Subtitle Result**. Enter the saved ID and use the same connection. While processing, rerun **only this scenario**. When **Processing status** is `1`, open **Video URL**, download the MP4 and listen to the English dialogue. This scenario never submits a new clip.

The sample comes from the [Weydub Creator Kit](https://weydub.com/creator-kit/). To dub your own clip, replace the sample URL and check the spoken and target languages before submitting.

## Try a caption or image workflow

Import one blueprint into each blank scenario as above. The three creation examples open in preview mode. To process a sample, turn **Submit billable job** on and run the creation scenario once. Copy the Job ID into the matching result scenario, using the same connection. Rerun only the result scenario until **Processing status** is `1`.

| Start here | Open the result | What to check |
|---|---|---|
| [Read visible Chinese captions](blueprints/read-visible-captions.json) | [Video or Subtitle Result](blueprints/check-dubbed-clip.json) → **Source SRT URL** | The lamp clip has three lines of Chinese text. Compare the downloaded SRT with the [original timed captions](https://weydub.com/creator-kit/clips/pocket-light/zh.srt). OCR reads the picture; it doesn't transcribe the narrator. |
| [Remove the bottom caption with Lite](blueprints/remove-bottom-caption.json) | [Video or Subtitle Result](blueprints/check-dubbed-clip.json) → **Video URL** | The text changes position between shots. Compare the input and output at 2.31, 6.55 and 12.18 seconds. Only the last caption falls inside this module's bottom 18% band. To clean all three, see the [full-frame Pro comparison](../../examples/full-frame-removal/). |
| [Translate the caption on a product photo](blueprints/translate-captioned-image.json) | [Image Result](blueprints/check-translated-image.json) → **Translated image URL** | The [original photo](https://weydub.com/creator-kit/clips/pocket-light/zh.webp) shows a folding lamp. Near the bottom, the Chinese text asks the reader to turn it on. Look for that message in English in the translated image. **Clean background URL** is a different output: the lettering has been removed. |

## Module reference

The app also includes **Make an API call**, a signed JSON POST module for advanced workflows. Enter a leading-slash path such as `/point/query` and a JSON object; the module sends it to Weydub's fixed media gateway with the connection credentials. It accepts paths and bodies only, does not follow redirects, and never accepts a full URL. Use the four named modules when they cover your workflow because their fields and result checks are safer and easier to map. The universal module is for a Weydub endpoint documented in the [developer guide](https://weydub.com/docs/api/), not for arbitrary third-party URLs.

Keep your own Weydub App Key and App Secret in a Make connection. The connection checks access with a balance query. A RapidAPI key uses a different authentication method.

For an image, run the module once with **Submit billable job** set to **No**. Expand **Request preview (no submission)**: `downloadInfo` should contain the full image URL, and `srcLang` and `tgtLang` should match the labels you want to translate. This uses a Make operation without creating a Weydub job.

Leave **Submit billable job** off when designing a workflow. Turn it on only when you want to process the file using the connected Weydub account. Save the returned **Job ID**. Use **Get an Image Result** for a photo or **Get a Video or Subtitle Result** for a video work ID. Query that ID instead of executing the create step again.

An image status of `1` means the translated image is ready. The clean-background URL is a separate optional file without the translated labels. An image status above `1` means processing failed: keep the ID and support trace and stop polling. A successful Make operation alone does not mean the media was processed successfully. Make operation credits and Weydub processing credits are separate.

**Looking for an SRT?** In **Get a Video or Subtitle Result**, enter the work ID for the OCR job and use the connection that submitted it. At `Processing status: 1`, open **Source SRT URL** for the captions in their original language. If **Get an Image Result** reports that no image matches, switch lookup modules with the same work ID. You do not need to upload the clip again.

**Got a job ID but no video?** An accepted submission gives you an ID before the video is ready. Check it with **Get a Video or Subtitle Result**. If the status is `73`, the connected Weydub account has too few processing credits and the job has not started. Stop polling, check that account's balance and resolve the credit issue before retrying. If the status is `83`, the video has already been processed but is locked for insufficient credits. Keep the original job ID and resolve the balance before trying to download it; do not submit the video again. Buying more Make operations does not add Weydub processing credits.

**Resume a video stopped at `73`:** After topping up the Weydub account that owns the job, check the original ID once more. If it still shows `73`, use **Make an API call** with the same connection. Set **URL** to `/work/video/redo` and **JSON body** to `{"id":12345}`, replacing `12345` with the original numeric work ID. Run it once. A business response of `code: 1000` with `body: true` means the retry was accepted; use **Get a Video or Subtitle Result** with the same ID for delivery. If the retry is declined or its response is lost, check that ID before taking another action. Retry only a job you intend to pay for.

`app.mjs` exports the base, connection, six named module definitions and the universal `makeApiCall` definition. For a module, `communication`, `mappable` and `interface` correspond to the Make editor's **Communication**, **Mappable Parameters** and **Interface** tabs. Request bodies and their signatures use the same serialization.
