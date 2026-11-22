# Weydub Pro Subtitle Removal

If switching off subtitles leaves the words on screen, they are part of the video picture. Weydub Pro removes that text across the whole frame and gives you a cleaned MP4. Compare [original frames](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) with [the same frames after removal](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp). If prices or signs must stay visible, use [the area selector in the web editor](https://weydub.com/subtitle-removal/) instead.

## Install in Claude Code

Use Claude Code 2.1.330 or later with Node.js 22+ and npm available, then run:

```text
/plugin marketplace add https://github.com/JollyToday/GhostCut-auto_video_translation.git#weydub-claude-plugin
/plugin install weydub@weydub-directory
```

Open a new Claude Code session. You can leave the Weydub account fields empty for the sponsored trial.

## Try your own MP4 without a key

Ask **“Remove the burned-in captions from `launch-clip.mp4` using the free trial and save the result as `launch-clip-cleaned.mp4`.”** Choose an H.264 MP4 up to 60 seconds and 16 MiB that you have permission to upload. To test with a known example, use the input from the [15-second comparison](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/examples/full-frame-removal). Check the top, middle and bottom captions at 2.31, 6.55 and 12.18 seconds.

Claude Code asks before sending that file to Weydub and keeps a private receipt on disk. If you close the session, ask it to check the same receipt and finish the download. Keep its contents private. The result is a new MP4; the original stays intact. Anonymous integrations share 100 sponsored clips each UTC month. When that allowance runs out, the plugin stops. It never charges your account as a fallback.

## Use your account for a video URL

1. To preview settings without processing, ask **“Preview subtitle removal for `https://example.com/source.mp4`.”** When ready to process a URL using credits, open **weydub** in `/plugin` and configure your own [Weydub API](https://weydub.com/docs/api/) App Key and App Secret. Use the masked plugin fields; keep both values out of chat.
2. Provide a direct HTTPS link to a video you own or have permission to process. When ready, ask Claude to submit that clip. Each new submission uses credits at your [Weydub account rate](https://weydub.com/vip/pricing-detail/).
3. Keep the returned work ID. Ask Claude to check that ID. When ready, open the private download link and save the MP4. If submission times out before you see an ID, check your Weydub task history before trying again.

Claude Code runs a local Node.js MCP server with three tools: preview, submit and status. The server uses the dependencies pinned in the included npm lockfile. In a client that does not run that server, including Claude web chat, the skill can explain the workflow and link to the web editor; chat alone cannot create a job or retrieve an MP4.

## Data and privacy

For a sponsored trial, the local script sends the selected file and a private receipt to `api.weydub.com`. Status sends only that receipt. Downloads fetch the finished MP4 from `gc70.cdn.izhaoli.cn` without forwarding the receipt or any account credentials. Keep the receipt and downloaded MP4 in a private location.

URL preview makes no network request. On a paid submission, the local server sends the source URL, full-frame Pro settings, App Key and request signature to `api.zhaoli.com`, Weydub's processing service. The service fetches the source video. The App Secret stays local and signs requests. Status sends the work ID to that same service. The local server has no analytics or job database. Your Claude conversation may contain source links, IDs and result links. Anyone who has a signed media link may be able to download the video. See [Weydub's privacy policy](https://weydub.com/Privacy_Policy_en.pdf) or contact niumo@weydub.com.

The included MIT license applies to the plugin code. The local-file trial is sponsored; paid URL processing uses your Weydub account.
