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

A shared sponsored trial, where available, is one file per verified customer across participating products. An enabled Lite prepaid subscription grants 50 started-half-minute units per verified $6.50 payment. Polls consume requests but no processing units. The image and dubbing upload previews do not accept prepaid processing; existing v1 subscriptions are not converted to these units.

After a timeout or `503`, retry only with the original key and identical bytes and settings. `402` means the trial or processing allowance is unavailable; `409` means the key was already used for different input. For `413` reduce the file size; for `415` check the actual file format and content type. Keep the job ID for support.

See [subtitle removal examples](https://weydub.com/subtitle-removal/), [translated product images](https://weydub.com/image-translator/) and [video translation](https://weydub.com/video-translator/).
