# RapidAPI file uploads: provider preview

These instructions are for the **upload-version preview** of subtitle removal, image translation and translated dubbing. Use them only when your selected version shows **Link** and a binary upload operation in the Playground. If you see **Open Account** and a `urls` or `downloadInfo` field, follow the [live v1 guide](rapidapi.md) instead. The separately published [OCR API](rapidapi-ocr.md) has its own walkthrough.

| What you need | File to upload | Headers in addition to `Idempotency-Key` and `Content-Type` | When ready, download |
| --- | --- | --- | --- |
| A clean MP4 for new captions | `POST /v1/subtitles/remove`; H.264 MP4, up to 60 seconds and 16 MiB. Lite targets the bottom 18% of the frame. | No language headers. A provider-activated Lite prepaid plan uses `X-Weydub-Billing-Mode: prepaid`. | `videoUrl` |
| A translated product image | `POST /v1/images/translate`; one still JPEG, PNG or WebP, up to 8 MiB and 2,000 px per side. | `X-Source-Language` for the writing on the image; `X-Target-Language` for the output. | `imageUrl` |
| Translated speech and captions | `POST /v1/videos/dub`; H.264 MP4 with one AAC speech track, up to 60 seconds and 16 MiB. Use a voice you have permission to process. Burned-in captions remain. | `X-Source-Language` for the speech; `X-Target-Language` for the new voice. Select different languages. | `videoUrl` |

1. In [Weydub account linking](https://weydub.com/account/connect/rapidapi/), enter the RapidAPI handle that owns your application (the team handle for a team app). Send the one-time code in `{"code":"..."}` to `POST /v1/account/link` through the matching listing within ten minutes. Never send a Weydub password or AppSecret.
2. Copy the request host and RapidAPI authentication headers from that version's Playground. Send the actual file bytes, for example `--data-binary @episode.mp4` with `Content-Type: video/mp4`. For a JPEG use `--data-binary @label.jpg` and `Content-Type: image/jpeg`. Do not send a URL or multipart form. Give this file, operation and language pair a unique `Idempotency-Key`.
3. A `202` response contains a `jobId`, not a deliverable. Query `GET /v1/jobs/{jobId}` through the **same product**. Wait while `state` is `pending`; use the result field in the table when it is `ready`. A `failed` job has no file to download. Check old numeric v1 IDs through the original listing.

### Run an image or dubbing upload

You need access to the upload version first. For a draft, confirm with the provider that your app can reach that version; choosing a draft in Studio does not switch a public subscription.

In the upload operation, choose **Body → application/octet-stream → Upload file**. Select the original image or MP4, then set the two language headers and `Idempotency-Key` in **Headers**. Use one file, not a ZIP or a JSON object. For command-line use, copy the RapidAPI host from the same operation and follow the Bash examples below (curl 7.76+ and jq). They send the precise image or video content type; both upload methods return the same job ID when retried with identical inputs and key.

```bash
read -rp 'RapidAPI host (no https://): ' RAPIDAPI_HOST
read -rsp 'RapidAPI key: ' RAPIDAPI_KEY; echo
rapid() {
  [[ $RAPIDAPI_HOST =~ ^[a-z0-9-]+\.p\.rapidapi\.com$ ]] || return 1
  local path=$1; shift
  curl --silent --show-error --fail-with-body \
    -H "X-RapidAPI-Host: $RAPIDAPI_HOST" -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
    "$@" "https://$RAPIDAPI_HOST$path"
}
```

If this subscription is not linked yet, request a fresh code as described above:

```bash
read -rsp 'One-time Weydub link code: ' code; echo
jq -nc --arg code "$code" '{code:$code}' |
  rapid /v1/account/link -H 'Content-Type: application/json' --data-binary @-
unset code
```

Choose **one** of these examples for the selected product. Each assumes the source is Chinese and the desired output is English. Use a new idempotency key for each new file or language pair; keep that key if you retry the same upload.

**Product image** (use `image/png` or `image/webp` instead for those formats):

```bash
receipt=$(rapid /v1/images/translate \
  -H 'Content-Type: image/jpeg' -H 'Idempotency-Key: product-17-label-zh-en-v1' \
  -H 'X-Source-Language: zh' -H 'X-Target-Language: en' \
  --data-binary @label.jpg) && printf '%s\n' "$receipt"
```

**Dubbed video** (use a clip with audible speech):

```bash
receipt=$(rapid /v1/videos/dub \
  -H 'Content-Type: video/mp4' -H 'Idempotency-Key: episode-17-dialogue-zh-en-v1' \
  -H 'X-Source-Language: zh' -H 'X-Target-Language: en' \
  --data-binary @episode.mp4) && printf '%s\n' "$receipt"
```

An accepted upload looks like `{"jobId":"0123456789abcdef0123456789abcdef"}`. Keep the actual ID. The command below checks it once; if `pending`, wait 30 seconds and repeat the status request, without uploading again.

```bash
job_id=$(jq -er '.jobId | strings | select(test("^[a-f0-9]{32}$"))' <<<"$receipt") &&
  status=$(rapid "/v1/jobs/$job_id") && jq '{jobId,state}' <<<"$status"
```

Once `ready`, download the file with a separate request. The download host does not need your RapidAPI key. Use `translated-image` as the filename for images (the format may differ from the source) or `dubbed.mp4` for video.

```bash
output=translated-image  # or: output=dubbed.mp4
url=$(jq -er 'select(.state == "ready") | (.imageUrl // .videoUrl) | strings | select(startswith("https://"))' <<<"$status") &&
  curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' \
    --output "$output" "$url"
```

A shared sponsored trial, where available, is one file per verified customer across participating products. An enabled Lite prepaid subscription grants 50 started-half-minute units per verified $6.50 payment. Polls consume requests but no processing units. The image and dubbing upload previews do not accept prepaid processing; existing v1 subscriptions are not converted to these units.

After a timeout or `503`, retry only with the original key and identical bytes and settings. `402` means the trial or processing allowance is unavailable; `409` means the key was already used for different input. For `413` reduce the file size; for `415` check the actual file format and content type. Keep the job ID for support.

See [subtitle removal examples](https://weydub.com/subtitle-removal/), [translated product images](https://weydub.com/image-translator/) and [video translation](https://weydub.com/video-translator/).
