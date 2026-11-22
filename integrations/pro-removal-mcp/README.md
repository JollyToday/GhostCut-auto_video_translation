# Weydub Pro Subtitle Removal

Remove subtitles that are part of the video picture and download the cleaned MP4 from your MCP client. Compare [frames from the original clip](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) with [the same frames after cleaning](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp).

Pro checks the **whole frame**. This can also remove a price, shop sign or logo. If you want to preserve text outside the subtitles, [select the caption area in the Weydub editor](https://weydub.com/subtitle-removal/). If the captions disappear when you turn off a subtitle track, you probably do not need to process the picture at all.

To see the effect without connecting an account, [play the original and cleaned clips](https://weydub.com/creator-kit/#compare). To try a clip of your own without a key, use the [separate sponsored trial](../../plugins/weydub/skills/pro-subtitle-removal/SKILL.md): it accepts a local H.264 MP4 up to 60 seconds and 16 MiB, subject to the shared monthly allowance. The Docker tools below use your own Weydub account for processing.

## Run locally with Docker

With Docker running in Linux container mode, download the image and its matching `.sha256` file from [Weydub's Docker release](https://github.com/JollyToday/GhostCut-auto_video_translation/releases/tag/weydub-pro-container-v1.0.0). Use `arm64` on Apple Silicon or ARM Linux; use `amd64` on Intel/AMD. No repository checkout or API account is needed. In the directory with the downloads, run the commands for your architecture. For example, on Apple Silicon:

```sh
shasum -a 256 -c weydub-pro-removal-linux-arm64.tar.gz.sha256
docker load --input weydub-pro-removal-linux-arm64.tar.gz
```

On Linux you can use `sha256sum -c`. On Windows compare `Get-FileHash .\weydub-pro-removal-linux-amd64.tar.gz -Algorithm SHA256` with the matching checksum before loading. Both archives load the tag `weydub/pro-subtitle-removal:1.0.0`. To build from source instead, run this in the adapter directory:

```sh
docker build -t weydub/pro-subtitle-removal:1.0.0 .
```

Using Cline? Follow the [Cline installation and free preview](llms-install.md). It includes the source checkout, a noninteractive CLI command, and an alternative for the editor extension. No Weydub key is needed for the preview.

For a client that accepts `mcpServers` JSON, add:

```json
{
  "mcpServers": {
    "weydub-pro-removal": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i", "--pull=never", "--read-only", "--cap-drop=ALL",
        "--security-opt=no-new-privileges",
        "-e", "WEYDUB_APP_KEY", "-e", "WEYDUB_APP_SECRET",
        "weydub/pro-subtitle-removal:1.0.0"
      ]
    }
  }
}
```

Start with no credentials to try `preview_removal`. It checks the link format locally; it does not fetch the video, preview cleaned frames or spend credits. For actual jobs, make your [Weydub API credentials](https://weydub.com/docs/api/) available as `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` in the environment of the MCP client that launches Docker. A desktop app opened from a launcher may not inherit your shell environment. Use its secret settings or start it from the configured environment. Do not paste keys into chat. The container needs outbound HTTPS to `api.zhaoli.com`, Weydub's processing service.

## Clean one clip

1. Give `preview_removal` a direct HTTPS link to a video you own or may process. A social post, local file path or link that requires signing in is not a direct video link. When using a temporary media link, leave it valid long enough for the service to fetch the clip.
2. When you are ready, approve **one** `submit_removal` call with `confirm_charge: true`. Each new submission can spend credits on your [Weydub account](https://weydub.com/vip/pricing-detail/). Save the `work_id` it returns. If the connection times out before you get an ID, check your Weydub task history before submitting again; this adapter cannot deduplicate a second request.
3. Call `check_removal` with the saved `work_id` (as a string). If it says `processing`, check the same ID later. When it says `ready`, open the private `download_url` and save the MP4. Checking status never starts a second job. Treat the result link as private.

**Support and security reports:** Contact the Weydub team privately at `niumo@weydub.com`. Include the adapter version and what happened; omit API credentials, private video links and download links.
