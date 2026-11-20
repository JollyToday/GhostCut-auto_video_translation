# Weydub for Pipedream Connect

These are the six proposed actions for the [Weydub media API](https://weydub.com/docs/api/). The first four accept one downloadable HTTPS file. To check a job, keep its `jobId` and use one of the two result actions. Pipedream registration is pending; these actions are not yet selectable in its public catalog.

| Start with | What to specify | Result to retrieve |
| --- | --- | --- |
| Remove Burned-In Subtitles | A clip with subtitles in the bottom 18% of the frame (Lite) | `videoUrl` |
| Extract Full-Frame OCR Subtitles | A video and the language of its visible text; no region or transcript required | `sourceSrtUrl` |
| Translate and Dub Video | A clip you have permission to dub, its spoken language and your target language | `videoUrl` |
| Translate Image Text | A product image and its source and target languages | `imageUrl`; `cleanBackgroundUrl` is the optional background without text |

For example, an episode delivered without a subtitle file needs **Extract Full-Frame OCR Subtitles**. Select the language you *see*, even if the narrator speaks a different language. Preview first. When ready, turn on **Submit Billable Job** for that clip, store the returned `jobId` with the episode name, and call **Get Video or OCR Result** with that ID. At `status: 1`, save `sourceSrtUrl` alongside the video. Use **Get Image Result** for image jobs. If the service times out after submission, check your task list before sending the file again.

The proposed app uses the customer's connected Weydub credentials (`app_key`, `app_secret`); it does not use RapidAPI keys or a shared Weydub balance. The account field names must be confirmed when Pipedream provisions the app. Deliver media URLs only to the accounts and systems authorized to process the file.

For a video job, status `73` means the connected Weydub account has insufficient processing credits and the job has not started. Stop polling and check that account before retrying. At `83`, the work is already done but the output is locked; resolve the balance and look up the **same** ID. For an image, use `imageUrl` for the translated artwork. A background-only file is not a completed translation.

Run `node --test check.test.mjs` here to test previews, request signing, asynchronous results and failure handling without credentials or paid work. The request contract is generated from the repository's public Postman collection; run `node integrations/build-contract.mjs --check` from the repository root to verify it.
