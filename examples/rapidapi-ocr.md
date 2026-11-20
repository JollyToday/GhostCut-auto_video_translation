# From a captioned MP4 to a timed SRT

You have the finished video but not the subtitle file. Turn off captions in your player. If the words stay on screen, you can recover them with [Weydub Subtitle Extraction on RapidAPI](https://rapidapi.com/jollytoday-jollytoday-default/api/weydub-subtitle-extraction). The output is an editable SRT in the language on screen. The video itself is unchanged.

## What the result looks like

Our reference clip is a roughly seven-second Chinese tea tutorial from the [Weydub material library](https://weydub.com/material/). Full-frame OCR returned three cues in a direct Weydub test. Here is the first one:

```srt
1
00:00:00,167 --> 00:00:01,767
如何品鉴红茶
```

Use any short clip you have permission to process. No audio track is required. The Playground accepts a local file; SDK and cURL clients can send the raw bytes as `video/mp4` or `application/octet-stream`. If you only hear the words, use [speech transcription instead](https://weydub.com/technology/ai-subtitle-generation-video-ocr-asr/).

## Link your app once

Choose BASIC on the [OCR listing](https://rapidapi.com/jollytoday-jollytoday-default/api/weydub-subtitle-extraction). Sign in to [Connect RapidAPI on Weydub](https://weydub.com/account/connect/rapidapi/) and enter the RapidAPI profile handle that owns your app. For a team app, enter the team's handle. In the Playground, select **Link your Weydub account** and send `{"code":"YOUR_CODE"}` within ten minutes. Wait for `{"linked":true}`.

## Upload one local clip

Use an H.264 MP4 up to 60 seconds and 16 MiB. If it has audio, the audio must be AAC. Choose the language of the printed text. The example uses Chinese (`zh`) and reads `clip.mp4` from your current directory. Set your own RapidAPI app key in `RAPIDAPI_KEY` locally.

```sh
: "${RAPIDAPI_KEY:?Set your RapidAPI app key locally}"
host=weydub-subtitle-extraction.p.rapidapi.com
curl --silent --show-error --fail-with-body "https://$host/v1/subtitles/extract" \
  -H "X-RapidAPI-Host: $host" -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H 'Content-Type: video/mp4' -H 'X-Source-Language: zh' \
  -H 'Idempotency-Key: tea-01-zh' --data-binary @clip.mp4
```

Save `jobId` from the `202` response. If the connection drops, reuse the same file, language and idempotency key. For a different clip or language, choose a new key.

## Download and check the SRT

```sh
job_id=REPLACE_WITH_RETURNED_JOB_ID
curl --silent --show-error --fail-with-body "https://$host/v1/jobs/$job_id" \
  -H "X-RapidAPI-Host: $host" -H "X-RapidAPI-Key: $RAPIDAPI_KEY"
```

While `state` is `pending`, wait before checking the same ID again. At `ready`, open the private `srtUrl` in your browser to download the SRT; the download host does not need your RapidAPI key. If `failed`, keep the job ID for support. Compare the text with the picture: full-frame OCR can also pick up a sign or a product label.

**What does the first clip cost?** The November 20 through 26, 2026 (UTC) pilot offers one sponsored job per verified Weydub customer, shared across participating operations and subject to daily availability. An upload rejected with `402` starts no new media job. There is no automatic switch to paid OCR. RapidAPI request and bandwidth fees are separate; see Pricing on the listing. Paid OCR is by invitation and requires activation after payment.
