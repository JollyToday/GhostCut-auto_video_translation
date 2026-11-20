# Weydub for MCP clients

[Download the desktop extension](https://github.com/JollyToday/GhostCut-auto_video_translation/releases/download/weydub-mcp-v1.0.1/weydub-media.mcpb) and open it in a client that supports `.mcpb` extensions. Enter your own Weydub AppKey and AppSecret in the extension settings. You can find the package and its checksum in the [official MCP Registry entry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.JollyToday%2Fweydub-media/versions/1.0.1).

### First run: get an SRT from a video

1. Give your client a direct HTTPS link to a video you have permission to process. Ask: “Preview full-screen OCR for this video. The text on screen is Chinese. Don't submit it yet.” The tool `extract_video_subtitles` previews the request without using Weydub credits. Choose the language of the writing, even when a different language is spoken.
2. Check the source and language. Ask: “Submit this OCR request once and show me the job ID.” Keep the number after `Job`. Processing uses your own [Weydub account and rates](https://weydub.com/vip/pricing-detail/).
3. Ask: “Check that same video job and give me the SRT when it's ready.” The client calls `check_job` with `kind: "video"` and your ID as a string. When `status` is `1`, download `sourceSubtitles`. If the job is still processing, check the same ID later. Submitting the original request again starts a separate job.

### Which file should I download?

| To get | Tool to call | Kind in `check_job` | Field to download on success |
|---|---|---|---|
| A clean video | `remove_video_subtitles` | `video` | `video` (MP4). Lite removal targets the bottom 18% of the frame. |
| A subtitle file | `extract_video_subtitles` | `video` | `sourceSubtitles` (SRT). Full-screen OCR can capture signs and labels as well as captions. |
| A dubbed video | `translate_and_dub_video` | `video` | `video` (MP4). Choose the spoken and target languages; original burned-in captions remain. |
| A translated image | `translate_image` | `image` | `output` (image). Supply the language of the image text and the desired translation. |

Each creation previews by default. Only set `submit: true` when you intend to process one file. If a submission is interrupted before you receive an ID, check your Weydub job history before trying again. To fetch a result, use the same account that submitted it. You don't need to send credentials in a chat message.

### Use a local stdio client

With Node.js 20+ installed, clone this repository and run `npm ci --ignore-scripts` and `node check.mjs` in `mcp/`. Set the client's command to `node` and its argument to the absolute path of `mcp/server.mjs`. Supply `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` through the client's local credential settings.

[Weydub API documentation](https://weydub.com/docs/api/)
