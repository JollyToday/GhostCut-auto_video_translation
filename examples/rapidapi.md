# Use Weydub through RapidAPI

Pick the listing by the **file you need back**. Open its Playground to get the correct host and code snippet for your application. The direct Weydub CLI and Postman collection use a different signing method; a RapidAPI key will not work there.

| I need | Where to start | What I get |
| --- | --- | --- |
| A product image with translated labels | [Image Translation](https://rapidapi.com/jollytoday-jollytoday-default/api/image-translation) | A newly rendered image |
| A video without captions burned into the picture | [Remove Subtitles](https://rapidapi.com/jollytoday-jollytoday-default/api/auto-video-watermark-or-subtitles-remove) | A cleaned video, not an SRT |
| A version of a spoken clip in another language | [Video Translation](https://rapidapi.com/jollytoday-jollytoday-default/api/video-translation) | A dubbed video, optionally with new captions |
| An alternate crop, trim or mirrored rendition of my video | [Video Reproduction or De-duplication](https://rapidapi.com/jollytoday-jollytoday-default/api/video-reproduction-or-de-duplication1) | An edited video, not a duplicate-detection report |

For a timed SRT from visible captions, use [full-frame OCR through the direct API](../README.md#try-the-media-api). Select the language you see on screen. For high-emotion dubbing, use the direct `dub` example. The RapidAPI v1 dubbing example offers male, female and automatic narration choices.

## Open an account, then submit one file

Select your application and call **Open Account** once with your subscriber identity. A response with `code: 1000` and `body.uid` confirms account setup. Your UID is not a media job ID. Changing `customIdentity` does not create another customer allowance.

For a first image, open **Translate Image** and use the public product photo in its example. It supplies `downloadInfo` as a JSON string, with `srcLang: "zh"`, `tgtLang: "en"`, `translateOn: 1` and `synthesisOn: 1`. For a video, replace the placeholder URL with a direct link to a clip you control. The download must work without a website login. The v1 video translation example uses `sourceLang: "cn"` for Chinese speech.

## Retrieve the right file

| Job | Save this from the create response | Send to **Get Result** | Download on success |
| --- | --- | --- | --- |
| Image | The numeric `body` | `{"id": 12345}` | When `body.status` is `1`, use `body.result.output_url`. `inpaint_url` is the background with the text removed. |
| One video | `body.dataList[0].id` | `{"idWorks": [12345]}` | Find the matching entry in `body.content`. When `processStatus` is `1`, use its `videoUrl`. |
| A video project | `body.idProject` | `{"idProjects": [12345]}` | Match the returned work entries to your source clips. |

`12345` is illustrative. Substitute the ID from your own response. Use the status request to check progress; repeating the create request starts another job. For product photos, compare the smallest label and its units. For dubbed clips, check the first and last spoken lines. Adding translated captions does not erase old ones.

## HTTP 200, but no job ID

Read the JSON `code` and `msg`. `4005` (点卡不足) means the service did not accept a processing job for lack of processing credits. There is no result to poll. **Open Account** and the listing's **Pricing** tab tell you different things: an account or a request allowance alone does not confirm available media-processing credit. Contact the provider through RapidAPI with the product name and response `trace`; do not send your key or purchase an upgrade just to troubleshoot this error.

For the browser tools, advanced models and direct integration options, see [Weydub](https://weydub.com/) and its [API documentation](https://weydub.com/docs/api/).
