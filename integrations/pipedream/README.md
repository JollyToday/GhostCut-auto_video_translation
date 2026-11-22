# Weydub for Pipedream Connect

These actions connect to the [Weydub media API](https://weydub.com/docs/api/). Each create action takes one downloadable HTTPS file. Keep its `jobId` and use the matching result action to retrieve the output. Pipedream registration is pending; the actions are not yet selectable in its public catalog.

| Start with | What to specify | Result to retrieve |
| --- | --- | --- |
| Remove Burned-In Subtitles (Full-Frame Pro) | A clip with burned-in captions; neither a language nor a box is required | `videoUrl` |
| Remove Burned-In Subtitles | A clip with subtitles in the bottom 18% of the frame (Lite) | `videoUrl` |
| Extract Full-Frame OCR Subtitles | A video and the language of its visible text; no region or transcript required | `sourceSrtUrl` |
| Translate and Dub Video | A clip you have permission to dub, its spoken language and your target language | `videoUrl` |
| Translate Image Text | A product image and its source and target languages | `imageUrl`; `cleanBackgroundUrl` is the optional background without text |

[Compare captions at the top, middle and bottom](../../examples/full-frame-removal/) before choosing a removal action. Both the input MP4 and the delivered Pro file are available to download.

**Which removal action should I use?** If a caption moves or appears above the lower band, start with **Full-Frame Pro**. It can also erase a price or a store sign you meant to keep. When that matters, use [the area selector in the Weydub editor](https://weydub.com/subtitle-removal/). The original **Remove Burned-In Subtitles** action still uses lower-band Lite in existing workflows. [Compare original and cleaned frames before choosing](https://weydub.com/creator-kit/#compare).

For a first Pro run, use the [15-second Creator Kit clip with captions in three positions](https://raw.githubusercontent.com/JollyToday/GhostCut-auto_video_translation/c4d72c4/examples/full-frame-removal/input.mp4). Follow [the full-frame removal steps](actions/remove-subtitles-pro/) to preview or submit the clip. In [Get Video or OCR Result](actions/get-video-result/), choose **Video (MP4)** and enter the same `jobId`. If it is still processing, repeat only the lookup. At status `1`, download `videoUrl`.

For example, an episode delivered without a subtitle file needs **Extract Full-Frame OCR Subtitles**. Select the language you *see*, even if the narrator speaks a different language. Preview first. When ready, turn on **Submit Billable Job** for that clip, store the returned `jobId` with the episode name, and call **Get Video or OCR Result** with that ID. At `status: 1`, save `sourceSrtUrl` alongside the video. Use **Get Image Result** for image jobs. If the service times out after submission, check your task list before sending the file again.

The proposed app uses the customer's connected Weydub credentials (`app_key`, `app_secret`); it does not use RapidAPI keys or a shared Weydub balance. The account field names must be confirmed when Pipedream provisions the app. Deliver media URLs only to the accounts and systems authorized to process the file.

For a video job, status `73` means the connected Weydub account has insufficient processing credits and the job has not started. Stop polling and check that account before retrying. At `83`, the work is already done but the output is locked; resolve the balance and look up the **same** ID. For an image, use `imageUrl` for the translated artwork. A background-only file is not a completed translation.

Run `node --test check.test.mjs` here to test previews, request signing, removal models, asynchronous results and failure handling without credentials or paid work. The original six actions use the contract generated from the public Postman collection; run `node integrations/build-contract.mjs --check` from the repository root to verify it. The separate Pro action uses the full-frame settings from the [Weydub Pro adapter](../pro-removal-mcp/).
