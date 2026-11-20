# Send one file with Postman

Start with a few seconds of captioned video or a single product image. You will send **one create request** to get a job ID, then **one status request** to find your file. Sending a create request again can spend more of your [Weydub API credits](https://weydub.com/vip/pricing-detail/). Postman does not sell media processing credits.

1. Open the [public collection](https://www.postman.com/niumo-136777cf-7015050/weydub-media-api/collection/01a3zbt/weydub-media-localization-api-byo-credentials) in your workspace. In Postman Desktop, you can also choose **Import** and paste the [public collection URL](https://www.postman.com/collections/60315697-192bfda6-a33b-4e3c-964d-8dc0f283af73), or import the [JSON file](Weydub.postman_collection.json). Import and select the [starter environment](Weydub.postman_environment.json).
2. In **Postman Vault** on your own machine, add `weydub-app-key` and `weydub-app-secret` from your [Weydub API account](https://weydub.com/docs/api/). Allow the collection script to use these two secrets when Postman asks. Keep them out of the shared environment.
3. Pick one row below. Set `video_url` or `image_url` to a directly downloadable HTTPS file; for translation, set `source_language` and `target_language`. The starter environment includes a public Chinese product label for an image-to-English test. For video, use a file you own. Send **only** the chosen create request.
4. Save the job ID from the response. The collection also writes it into the selected environment. Send **Check video job** or **Check image job** with that same environment. If processing is still underway, wait and send the **status** request again. When finished, open the result URL and download it.

| What you want back | Create request | What to set | Where to find your file on success |
|---|---|---|---|
| An SRT of the text visible on screen | Extract subtitles · Full-screen OCR | `video_url`, `source_language` (the language printed in the frame) | Check video job: `body.content[].srcSrtUrl` |
| A video without burned-in captions | Remove burned-in subtitles · Lite | `video_url`; the preset covers the bottom 18% of the frame | Check video job: `body.content[].videoUrl` |
| A video with translated speech | Translate speech · High-emotion dubbing | `video_url`, spoken source language, target language | Check video job: `body.content[].videoUrl`; existing burned-in text remains |
| A photo or label with translated text | Translate text in an image | `image_url`, printed source language, target language | Check image job: `body.result.output_url`; parse `result` first if it is a JSON string |

**How can I tell when it's finished?** `code: 1000` means the API accepted your request. A finished video has `processStatus: 1` on the row with your ID; a finished image has `body.status: 1`. A successful OCR returns a subtitle file; it need not return a video.

**Can I download subtitles after using my last credit?** In our test, the public collection processed a seven-second Chinese clip on an account with one credit. **Check video job** returned a three-cue SRT. With the balance now at zero, a second status request for the same job returned the same subtitles and the balance stayed at zero. Use the original job ID while the file is available. Sending **Extract subtitles** again would request new processing.

**What if my video has an ID but no download?** On the matching row, `processStatus: 73` means processing did not start because the connected account lacked credits. `83` means the result is locked pending sufficient credit. Check the balance of the Weydub account used for that request and keep the job ID. Buying a Postman plan does not add Weydub processing credits.

**What if I have more than one file?** All three video operations write to `video_work_id`. Save each returned ID alongside the original filename before sending the next file. To retrieve an earlier result, set `video_work_id` to that ID, then send **Check video job**. For images, use `image_job_id` and **Check image job**. If submission timed out without returning an ID, check your Weydub task history before sending it again.
