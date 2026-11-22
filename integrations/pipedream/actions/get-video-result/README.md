# Overview

Use **Get Video or OCR Result** to retrieve a cleaned clip, an English dub or a subtitle file. Looking up the same job again does not start another processing job.

# Getting Started

Use the same Weydub connection that created the job. Map `jobId` from the create action into **Job ID**; do not use the account ID or the original media URL.

| Your original action | Expected Output | Download when `status` is `1` |
| --- | --- | --- |
| Remove Burned-In Subtitles or Translate and Dub Video | Video (MP4) | `videoUrl` |
| Extract Full-Frame OCR Subtitles | Original subtitles (SRT) | `sourceSrtUrl` |

Existing workflows can leave **Expected Output** at **Any available file**. In a workflow that needs a specific file, choose that format so the next step cannot mistake a subtitle link for a delivered video. Treat all result links as private.

# Troubleshooting

If processing is still underway, wait and look up the same ID later. At `73`, check your Weydub account balance: processing has not started. At `83`, the output is locked pending credits; resolve the balance and check the same ID. If the job is complete but the requested file is missing, check the selected format and original ID before contacting [Weydub](https://weydub.com/docs/api/). For a translated photo, use **Get Image Result** instead.
