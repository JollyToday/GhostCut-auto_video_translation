# RapidAPI listing copy

This is the English copy for the four Weydub marketplace listings. The marketplace descriptions explain the v1 RapidAPI routes in this repository; the direct Weydub API has additional workflows and uses different credentials.

## Image translation

**Short description**

> Image translation API for product photos and size charts. Send an image URL and two languages; download the translated image or a text-free background.

**Long description**

> A supplier sends a product photo with Chinese labels, but your storefront needs English copy in the artwork itself. Send the image URL, source language and target language. The API reads visible text and renders the translation back into the image.
>
> Run **Open Account** once for the current RapidAPI subscription. In **Translate Image**, set `srcLang`, `tgtLang`, `translateOn: 1` and `synthesisOn: 1`. Save the numeric `body` from the accepted response and pass it as `id` to **Get Result**.
>
> When `body.status` is `1`, read `body.result`. It may be an object or a JSON string, so parse the string before reading it. `output_url` is the rendered translated image. `inpaint_url` is the optional background with the original text removed. Check prices, units, model numbers and small print against the source before publishing.
>
> A direct HTTPS image file is required. A login page, product detail page or share URL is not an image input. If a request returns `4005` without a job ID, keep the `trace` and contact the provider; do not submit the same image repeatedly.

Website: <https://weydub.com/image-translator/>

## Remove subtitles

**Short description**

> Remove hardcoded subtitles from video when captions stay visible after you turn them off. Download a clean video for your next caption track.

**Long description**

> Turn captions off in the player first. If the words remain, they are part of the picture and this is the right workflow. The API removes visible subtitles and returns a clean video that you can caption again. If the player hides the words, keep the subtitle track and use a subtitle editor instead.
>
> Run **Open Account** once for the current RapidAPI subscription. In **Remove Subtitles**, replace the placeholder in `urls` with a direct HTTPS file URL you own or are authorized to process. Set `needChineseOcclude: 1` and set `videoInpaintLang` to the language printed on screen. Save `body.dataList[0].id` and query it with `idWorks`; if the create response gives you `body.idProject`, query that project with `idProjects`.
>
> When the matching `body.content` item has `processStatus: 1`, download `videoUrl`. Compare the same frame before and after where a caption crosses a hand, moving subject or product edge. Match batch results by work ID. This operation returns a video, not an SRT; use full-frame OCR when you need timed subtitle text.
>
> The `Requests` and `Video Task` meters are separate. Query an accepted work instead of creating it again. If creation returns `4005` without a work ID, keep the response `trace` and contact the provider before retrying.

Website: <https://weydub.com/subtitle-removal/>

## Video translation

**Short description**

> Video translation API for product demos and narrated clips. Choose spoken and target languages, keep background audio, and add translated captions if needed.

**Long description**

> Use this listing when a viewer needs to hear a presenter, product explanation or narrated clip in another language. The output is a video with a translated voice track. Choose the spoken language in `sourceLang`, the output language in `lang`, and a marketplace voice. The v1 listing can keep or remove background audio and can add translated captions.
>
> Run **Open Account** once for the current RapidAPI subscription. Replace the placeholder in `urls` with a direct HTTPS file URL you own or are authorized to process. For Chinese speech to English, use `sourceLang: "cn"` and `lang: "en"`. Choose `voice: 1` for male, `2` for female or `3` for automatic narration. `removeBgAudio: 0` keeps the original background audio. `needText: 1` adds translated captions; use `0` for no new captions.
>
> Save `body.dataList[0].id` and query it with **Get Result** using `idWorks`. When the matching item has `processStatus: 1`, download `videoUrl`. Listen to a complete sentence, a product name and the last spoken line. New translated captions do not erase text already burned into the picture; start with a clean master or use the subtitle-removal listing first.
>
> The marketplace v1 item does not describe high-emotion voice cloning; use the direct Weydub API guide for that workflow. The `Requests` and `Video Task` meters are separate. A `4005` response without a job ID has nothing to poll; keep the `trace` and contact the provider before changing plans or submitting again.

Website: <https://weydub.com/video-translator/>

## Video reproduction / de-duplication

**Short description**

> Trim, mirror or reframe a video you own. The legacy Video De-duplication API returns an edited copy; it does not compare files for duplicates.

**Long description**

> This is a historical editing listing. It can make a trimmed, mirrored or reframed copy of a video; it does not search a library for duplicate files, calculate a similarity score or remove subtitles.
>
> Run **Open Account** once for the current RapidAPI subscription. Replace the placeholder in `urls` with a direct HTTPS file URL you control. Turn on one edit, such as `needMirror: 1`, and leave the other edit switches off. Save `body.dataList[0].id` and query it with **Get Result** using `idWorks`.
>
> When the matching `body.content` item has `processStatus: 1`, download `videoUrl`. A mirrored image also reverses lettering, logos and directional gestures, so review the export before delivery. For subtitle removal or dubbing, use the dedicated Weydub listing instead.
>
> The `Requests` and `Video Task` meters are separate. Query the existing work ID while it processes. If creation returns `4005` without an ID, keep the `trace` and contact the provider before resubmitting.

Website: <https://weydub.com/docs/api/>

## Shared publishing notes

- The four listings use RapidAPI authentication. The direct Weydub API guide, Postman collection and repository signing examples use different credentials.
- `Requests` is separate from the media-processing meter. A request allowance does not prove that a subscription has enough processing credit.
- A response with `code: 1000` and a job ID means the job was accepted. Query that job; do not create it again to check progress.
- If `4005` is returned without a job ID, there is no result to poll. Keep `trace` and contact the provider without sending an API key.
- New translated captions do not remove text already burned into the video frames.
