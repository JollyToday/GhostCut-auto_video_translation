# Use Weydub through RapidAPI

Choose the listing by the file you want to deliver. For example, a store may need English labels **inside a product photo**, an English **voice track for a product demo**, or a **clean video master** for a new caption track. Those are three different jobs, even when the source material is for the same product.

The marketplace listings use RapidAPI authentication. The direct Weydub CLI, Postman collection and integrations in this repository use a different signing method; a RapidAPI key will not work with those direct API examples.

| I need | Start here | Output |
| --- | --- | --- |
| An editable subtitle file from text printed in a video | [Subtitle Extraction (full-frame OCR)](https://rapidapi.com/jollytoday-jollytoday-default/api/weydub-subtitle-extraction) | A timed SRT in the printed language |
| Translated labels inside a product image | [Image Translation](https://rapidapi.com/jollytoday-jollytoday-default/api/image-translation) | A newly rendered image |
| A video with burned-in text removed | [Remove Subtitles](https://rapidapi.com/jollytoday-jollytoday-default/api/auto-video-watermark-or-subtitles-remove) | A cleaned video, not an SRT |
| Spoken dialogue in another language | [Video Translation](https://rapidapi.com/jollytoday-jollytoday-default/api/video-translation) | A dubbed video, optionally with new captions |
| A second crop, trim or mirrored rendition | [Video Reproduction or De-duplication](https://rapidapi.com/jollytoday-jollytoday-default/api/video-reproduction-or-de-duplication1) | An edited video, not a duplicate-detection report |

## Extract an SRT from a local clip (OCR v2)

Start on the OCR listing's **BASIC** plan. [Connect your Weydub account](https://weydub.com/account/connect/rapidapi/) to the profile handle that owns your RapidAPI app, then redeem the single-use code with **Link your Weydub account** within ten minutes. For a team app, use the team's profile handle.

Upload a local H.264 MP4 (up to 60 seconds and 16 MiB) with **Extract full-frame subtitles from an MP4**. Send the file bytes, select the language of the words **on screen**, and reuse the same `Idempotency-Key` when retrying the same file and settings. Save the returned `jobId`. Check **Download your timed SRT** with that ID; when `state` is `ready`, download `srtUrl` without sending your API key to the file host. Follow the [seven-second walkthrough with cURL commands and sample SRT](rapidapi-ocr.md).

The November 20-26, 2026 (UTC) pilot offers one sponsored media job per verified customer while daily capacity lasts. BASIC does not automatically upgrade you. Paid OCR is by invitation and requires the provider to verify payment and activate units; RapidAPI request and bandwidth limits apply separately. For batch jobs with your own Weydub credentials, use the [direct API](../README.md#try-the-media-api).

## Open an account, then submit one file (v1 listings)

If you have provider preview access and your Playground shows **Link your Weydub account** and a binary upload instead of **Open Account**, use the [upload-version guide](rapidapi-upload-preview.md). The existing v1 subscriptions and numeric job IDs still use the v1 endpoints below.

Select your application and call **Open Account** once for the current RapidAPI subscription. A response with `code: 1000` and `body.uid` confirms account setup. The UID is an account identifier, not a media job ID. Changing `customIdentity` does not create another end-customer allowance.

If **Open Account** returns `9999` ("System error") without a UID, stop before creating a media job. Send the provider the listing, endpoint, time with timezone and `trace` privately through RapidAPI. Changing identities, adding personal contact details or connecting a social account is not the next step. Open Account does not sign you in to TikTok or publish a video.

**Before choosing a plan:** on **Pricing**, `Requests` is separate from the processing meter (`Advanced` for images, `Video Task` for video). A request allowance does not tell you how many minutes will render or confirm a free first job. If a short test returns `4005`, contact the provider with the `trace` before buying a larger plan.

For a first image, open **Translate Image** and use the public product photo in its example. `downloadInfo` is a JSON string containing a `url`, with `srcLang: "zh"`, `tgtLang: "en"`, `translateOn: 1` and `synthesisOn: 1`. For a video, replace the placeholder URL with a direct HTTPS link to a clip you control. The URL must serve the file without a website login. The v1 video translation example uses `sourceLang: "cn"` for Chinese speech.

### Try the first request locally

From this repository, run the [first-job example](rapidapi-first-job.mjs) with Node.js 20+. This prints the request for the public Chinese product photo, without making a network call or using quota:

```sh
node examples/rapidapi-first-job.mjs image
```

To see the request for your own file, set `MEDIA_URL` locally. Use `remove` for a clip with Chinese captions, `dub` for Chinese speech to English, or `edit` to mirror a clip. For different languages, change the fields in the Playground. The local preview prints your input URL; keep it private if it grants access to your file.

After **Open Account** succeeds, set `RAPIDAPI_KEY` locally. To send the previewed image request once, run `node examples/rapidapi-first-job.mjs image --submit`. The same flag works for video. This can consume processing credit. The script prints the status command for the returned job ID, or the Playground query if you received only a project ID. If the connection drops after submission, check the original request before running it again.

### Let a viewer upload a local clip and download a subtitled video

1. Let the viewer select a file. Upload it to your storage and give your backend a direct HTTPS read URL that stays valid until processing finishes. A local path, `blob:` preview URL or page behind a login will not work. Keep the RapidAPI key on your backend.
2. For **Chinese speech to English speech with English captions**, preview `DUB_CAPTIONS=1 node examples/rapidapi-first-job.mjs dub` with `MEDIA_URL` set locally. The payload uses `sourceLang: "cn"`, `lang: "en"` and `needText: 1`. Choose the supported spoken and target languages for other pairs in this listing's Playground. Send one create request for the chosen version; store the returned ID with the viewer's file and language.
3. Check **Get Result** using that ID. When the matching work has `processStatus: 1`, use its `videoUrl` to play the result or let the viewer download it. Store an authorized copy if your product needs to keep it. This produces a rendered video for one target language. For switchable captions in a player, supply separate timed subtitle tracks; `needText` is not a language switch or a stand-alone SRT export.

### What to test on your first clip

If your [Weydub material library](https://weydub.com/material/) contains **Sample video.mp4**, preview it first: the tea tutorial has Chinese captions and narration and lasts about seven seconds. There is also a longer clip with an aircraft wing and the same filename. Use the tea clip, or your own clip with a few visible captions and clear speech. Supply the **media file URL** you are authorized to use; the library page itself is not an API input.

| Goal | Set up the first run | Check the download |
| --- | --- | --- |
| Remove the Chinese captions | In **Remove Subtitles**, set `videoInpaintLang` to `zh`. | Pause at about one second, when the first caption is visible in the original. Compare the same frame in the output, then play through the other two captions. |
| Dub the Chinese narration into English | In **Video Translation**, use `sourceLang: "cn"`, `lang: "en"`, `removeBgAudio: "0"` and `needText: 0`. Use speech you have permission to dub. | Listen through the last line, about the color of the tea. Turning new captions off does not remove the Chinese words already in the picture. |
| Recover the captions as an SRT | In **Subtitle Extraction**, upload the MP4 bytes and choose `zh`. The scan covers the full frame. | In our direct API test the tea clip returned three cues. The first ran from `00:00:00,167` to `00:00:01,767`. OCR follows the words on screen, even if the audio is muted. |
| Translate the text on a product image | Use the **Translate Image** sample with `zh` to `en`; keep both translation and rendering enabled. | Open `output_url` and look for English labels. A direct API test of the sample rendered “One-click 3D conversion”. The optional `inpaint_url` is the background with the original labels removed. |

The OCR cue times and image label are observations from the **direct Weydub API**. They identify what to inspect; they do not establish an allowance or a successful paid run on a RapidAPI plan.

## Retrieve the right file (v1 listings)

| Job | Save this from the create response | Send to **Get Result** | Download on success |
| --- | --- | --- | --- |
| Image | The numeric `body` | `{"id": 12345}` | When `body.status` is `1`, read `body.result` (parse it first if it is a JSON string). Download `output_url`; the optional `inpaint_url` is the background with the text removed. |
| One video | `body.dataList[0].id` | `{"idWorks": [12345]}` | Find the matching entry in `body.content`. When `processStatus` is `1`, use its `videoUrl`. |
| A video project | `body.idProject` | `{"idProjects": [12345]}` | Match the returned work entries to your source clips. |

`12345` is illustrative. Substitute the ID from your own create response. A business response with `code: 1000` and a job ID means the job was accepted. Use the status request to check progress; repeating the create request starts another job. For product photos, compare the smallest label and its units. For dubbed clips, check the first and last spoken lines. Adding translated captions does not erase text already burned into the frames.

### Try one result lookup from your terminal

Already have an **image job ID**? With `curl` and `jq` installed, set `RAPIDAPI_KEY` in your local environment and run the following. Set `IMAGE_JOB_ID` to the numeric ID returned by **Translate Image**. This makes one status request against the image listing. It cannot start another translation; the lookup may count toward your request quota.

```sh
: "${RAPIDAPI_KEY:?Set your RapidAPI key locally first}"
: "${IMAGE_JOB_ID:?Set the numeric ID returned by Translate Image}"
host=image-translation.p.rapidapi.com
payload=$(jq -cn --argjson id "$IMAGE_JOB_ID" '{id: $id}') &&
response=$(curl --silent --show-error --fail-with-body "https://$host/image/translate/query" \
  -H "x-rapidapi-key: $RAPIDAPI_KEY" -H "x-rapidapi-host: $host" \
  -H 'content-type: application/json' --data-binary "$payload") &&
printf '%s\n' "$response" |
jq 'if .code != 1000 then {code, msg, trace}
    elif .body.status != 1 then {status: .body.status, trace}
    else .body.result | (if type == "string" then fromjson else . end)
         | {translated_image: .output_url, clean_background: .inpaint_url}
    end'
```

### Check a video or image job with Node.js

From this repository, run **one** command for the listing where you submitted your file. Set `RAPIDAPI_KEY` locally. Replace `12345` with your **work ID** for a video, or your **image job ID** for a photo. The [lookup script](rapidapi-result.mjs) uses Node.js 20+ with no packages to install.

| Your original request | Command |
| --- | --- |
| Remove burned-in subtitles | `node examples/rapidapi-result.mjs remove 12345` |
| Translate and dub speech | `node examples/rapidapi-result.mjs dub 12345` |
| Create a mirrored or trimmed edit | `node examples/rapidapi-result.mjs edit 12345` |
| Translate a product image | `node examples/rapidapi-result.mjs image 12345` |

Each invocation makes **one result query** and can count toward the listing's request quota. It never submits your media. `ready` includes the download URL; treat that link as private. `not_ready` means there is no final file yet. For `needs_attention`, stop polling and keep the job ID, status and response `trace` for support. In particular, an image status greater than `1` means the image failed to render. `no_match` means the requested item was not returned: check that you used the right listing and a work ID rather than a project ID. To query a whole project, use **Get Result** in the Playground with `idProjects`.

## HTTP 200, but no job ID

`4005` ("insufficient credits") means the processing service refused the job. An active Pro plan, remaining RapidAPI quota or a successful account setup does not explain why the processing check failed. **Stop submitting and do not poll without a job ID.** A failed call may still move a marketplace meter. Upgrading is not a troubleshooting step.

The first-job script prints a small receipt on a refusal. Send it privately to the provider with the time (including timezone) and plan. If using the Playground, record the listing and endpoint, HTTP status, business `code` and `trace`, RapidAPI request ID if shown, and any `Requests` / `Video Task` / `Advanced` meter readings already available. Do not make another request to measure the difference. Never include your key (even a prefix), authorization headers or signed media URL. Ask the provider to reconcile the subscription, processing account and any quota consumed without a job. A changed quota counter alone does not establish a monetary charge or refund.

### Does the video editing listing post to TikTok or prevent flags?

No. The legacy listing creates an edited video file from material you have rights to use. It cannot sign into a social account, publish for you, check a platform's moderation decision or guarantee acceptance of an upload.

For the browser tools, advanced models and direct integration options, see [Weydub](https://weydub.com/) and its [API documentation](https://weydub.com/docs/api/).
