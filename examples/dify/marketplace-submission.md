# Plugin submission: Weydub Pro Subtitle Removal

## Plugin information

- **Author**: weydub
- **Plugin name**: subtitle_removal
- **Version**: 0.1.1
- **Source repository**: https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/integrations/dify
- **Contact**: niumo@weydub.com

## Submission type

- [x] New plugin
- [ ] Version update

## What changed

Remove burned-in captions before re-localizing a video. The user supplies a direct HTTPS video link and runs one full-frame Pro job using their own Weydub credits. A second tool checks the original work ID and returns the private MP4 download link when ready. Checking a job never starts another one. Full-frame removal can also erase prices or signs; the README links to an editor for selecting a smaller area.

## Risk level

- [ ] Low risk
- [x] Medium risk
- [ ] High risk

The submission tool sends a user-supplied media URL to an external processing service and creates a billable job. The plugin itself contacts a fixed API host. Users connect their own developer credentials; these are not workflow inputs.

## Required checks

- [x] Reviewed the Marketplace submission requirements.
- [x] Reviewed the Plugin Development Guidelines. The plugin is free to install. Processing is billed to the connected Weydub account.
- [x] Tested on Dify Community Edition 1.20.0. **Cloud limitation:** this unsigned package has not been installed on Dify Cloud.
- [x] The package contains only runtime files and required documentation.
- [x] The package contains no secrets, local credentials, environment files, development state or caches.
- [x] There are no executables or bundled libraries; the PNG icon is the only binary asset.
- [x] The English README includes setup, inputs, download instructions, connection requirements and the source repository link.
- [x] `manifest.yaml` references the included `PRIVACY.md`.
- [x] User-facing text is in English.

## Security and privacy notes

The runtime signs HTTPS requests to `api.zhaoli.com` using a workspace-managed App Key and App Secret. It sends the App Key and a request signature; the secret stays in the plugin runtime. The processing service fetches the input video. Source URLs, work IDs and private download links may appear in Dify's run history. The plugin has no telemetry, shell execution, database access, browser automation or user-selectable API destination.

## Local validation

Installed 0.1.1 in an isolated Community Edition 1.20.0 workspace, verified the installed version and imported both [example workflows](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/examples/dify). The new result workflow returned `ready` for a real job created by the earlier 0.1.0 submit workflow. The MP4 downloaded with the same SHA-256 as the original delivery. The 0.1.1 test did not start a second billable job.

The Marketplace toolkit's `validate-difypkg.py`, `check-pr-body.py` and `check-pr-review-notes.py` reported no blocking findings. The package validator identified the declared processing host and flagged a URL validation expression for manual review. That expression returns a boolean and rejects embedded credentials. Requests go only to the documented host; user input does not select the API host.

`ffprobe -v error -show_entries stream=codec_name,width,height:format=duration,size -of json result.mp4` identified 720x1280 H.264, AAC, 6.780 seconds and 1,077,238 bytes. No proprietary video, media link, customer credential or QA run history is included in this submission.

## Reviewer notes

To test the submitted **plugin**, install the attached 0.1.1 package in a workspace that allows unsigned plugins, connect your own Weydub credentials, and import the [submit and result workflows](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/examples/dify). The submit tool uses the connected account's credits. Keep the work ID and run only the result tool until the MP4 is ready. If a submit times out before returning an ID, check the account's task history before retrying.

To see the media result **without an API key**, use the separate [sponsored workflow DSL](https://raw.githubusercontent.com/JollyToday/GhostCut-auto_video_translation/main/examples/dify/sponsored-removal.yml) with Studio's file import and the [licensed practice clip and frame comparison](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/examples/full-frame-removal). Create and save the receipt, submit the clip with that receipt, then check it and download the MP4. This workflow uses Dify's built-in nodes and the shared Weydub trial; it does not install or exercise the plugin.
