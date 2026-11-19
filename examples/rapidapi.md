# Use Weydub through RapidAPI

Choose the listing by the output you need. Each listing has its own Playground, host and generated code snippet.

The marketplace listings use RapidAPI authentication. The direct Weydub CLI, Postman collection and integrations in this repository use a different signing method; a RapidAPI key will not work with those direct API examples.

| I need | Start here | Output |
| --- | --- | --- |
| Translated labels inside a product image | [Image Translation](https://rapidapi.com/jollytoday-jollytoday-default/api/image-translation) | A newly rendered image |
| A video with burned-in text removed | [Remove Subtitles](https://rapidapi.com/jollytoday-jollytoday-default/api/auto-video-watermark-or-subtitles-remove) | A cleaned video, not an SRT |
| Spoken dialogue in another language | [Video Translation](https://rapidapi.com/jollytoday-jollytoday-default/api/video-translation) | A dubbed video, optionally with new captions |
| A second crop, trim or mirrored rendition | [Video Reproduction or De-duplication](https://rapidapi.com/jollytoday-jollytoday-default/api/video-reproduction-or-de-duplication1) | An edited video, not a duplicate-detection report |

For a timed SRT from visible captions, use [full-frame OCR through the direct API](../README.md#try-the-media-api). Select the language you see on screen. The RapidAPI video listing is the v1 speech dubbing route; the direct API exposes the full-frame OCR and high-emotion dubbing workflows separately.

## Open an account, then submit one file

Select your application and call **Open Account** once for the current RapidAPI subscription. A response with `code: 1000` and `body.uid` confirms account setup. The UID is an account identifier, not a media job ID. Changing `customIdentity` does not create another end-customer allowance.

For a first image, open **Translate Image** and use the public product photo in its example. `downloadInfo` is a JSON string containing a `url`, with `srcLang: "zh"`, `tgtLang: "en"`, `translateOn: 1` and `synthesisOn: 1`. For a video, replace the placeholder URL with a direct HTTPS link to a clip you control. The URL must serve the file without a website login. The v1 video translation example uses `sourceLang: "cn"` for Chinese speech.

## Retrieve the right file

| Job | Save this from the create response | Send to **Get Result** | Download on success |
| --- | --- | --- | --- |
| Image | The numeric `body` | `{"id": 12345}` | When `body.status` is `1`, read `body.result` (parse it first if it is a JSON string). Download `output_url`; the optional `inpaint_url` is the background with the text removed. |
| One video | `body.dataList[0].id` | `{"idWorks": [12345]}` | Find the matching entry in `body.content`. When `processStatus` is `1`, use its `videoUrl`. |
| A video project | `body.idProject` | `{"idProjects": [12345]}` | Match the returned work entries to your source clips. |

`12345` is illustrative. Substitute the ID from your own create response. A business response with `code: 1000` and a job ID means the job was accepted. Use the status request to check progress; repeating the create request starts another job. For product photos, compare the smallest label and its units. For dubbed clips, check the first and last spoken lines. Adding translated captions does not erase text already burned into the frames.

## HTTP 200, but no job ID

Read the JSON `code`, `msg` and `trace`. `4005` means the subscription does not have enough processing credit for the requested job. No job was created, so there is no result to poll. **Open Account** and the listing's **Pricing** tab tell you different things: an account or a request allowance alone does not confirm available media-processing credit. Contact the provider through RapidAPI with the product name and response `trace`; do not send your key or purchase an upgrade just to troubleshoot this error.

For the browser tools, advanced models and direct integration options, see [Weydub](https://weydub.com/) and its [API documentation](https://weydub.com/docs/api/).
