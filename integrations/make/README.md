# Weydub modules for Make

These definitions are used in a private Make custom app. There is no public install link yet. Developers can use the [direct API](https://weydub.com/docs/api/) independently.

Four actions submit a single file: remove lower-frame burned-in captions with Lite, extract visible subtitles with full-frame OCR, translate and dub speech, or translate text inside an image. For OCR, enter the language you see on screen. For dubbing, choose the language you hear and the language you want to deliver. Supply a directly downloadable HTTPS file you have permission to process.

Keep your own Weydub App Key and App Secret in a Make connection. The connection checks access with a balance query. A RapidAPI key uses a different authentication method.

For an image, run the module once with **Submit billable job** set to **No**. Expand **Request preview (no submission)**: `downloadInfo` should contain the full image URL, and `srcLang` and `tgtLang` should match the labels you want to translate. This uses a Make operation without creating a Weydub job.

Leave **Submit billable job** off when designing a workflow. Turn it on only when you want to process the file using the connected Weydub account. Save the returned **Job ID**. Use **Get an Image Result** for a photo or **Get a Video or Subtitle Result** for a video work ID. Query that ID instead of executing the create step again.

An image status of `1` means the translated image is ready. The clean-background URL is a separate optional file without the translated labels. An image status above `1` means processing failed: keep the ID and support trace and stop polling. A successful Make operation alone does not mean the media was processed successfully. Make operation credits and Weydub processing credits are separate.

`app.mjs` exports the base, connection and six module definitions. For a module, `communication`, `mappable` and `interface` correspond to the Make editor's **Communication**, **Mappable Parameters** and **Interface** tabs. Request bodies and their signatures use the same serialization.
