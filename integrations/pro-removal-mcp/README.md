# Weydub Pro Subtitle Removal

Remove subtitles that are part of the video picture and download the cleaned MP4 from your MCP client. Compare [frames from the original clip](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) with [the same frames after cleaning](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp).

Pro checks the **whole frame**. This can also remove a price, shop sign or logo. If you want to preserve text outside the subtitles, [select the caption area in the Weydub editor](https://weydub.com/subtitle-removal/). If the captions disappear when you turn off a subtitle track, you probably do not need to process the picture at all.

Compare the [original and actual Pro output](../../examples/full-frame-removal/) where captions appear in three positions across cuts. In version 1.1.0 you can try a local clip in your MCP client without a Weydub key. The original account-based tools still accept direct HTTPS links.

## Run locally with Docker

With Docker running in Linux container mode, download the image and its matching `.sha256` file from [Weydub's Docker release](https://github.com/JollyToday/GhostCut-auto_video_translation/releases/tag/weydub-pro-container-v1.1.0). Use `arm64` on Apple Silicon or ARM Linux; use `amd64` on Intel/AMD. No repository checkout or API account is needed. In the directory with the downloads, run the commands for your architecture. For example, on Apple Silicon:

```sh
shasum -a 256 -c weydub-pro-removal-linux-arm64.tar.gz.sha256
docker load --input weydub-pro-removal-linux-arm64.tar.gz
```

On Linux you can use `sha256sum -c`. On Windows compare `Get-FileHash .\weydub-pro-removal-linux-amd64.tar.gz -Algorithm SHA256` with the matching checksum before loading. Both archives load the tag `weydub/pro-subtitle-removal:1.1.0`. To build from source instead, run this in the adapter directory:

```sh
docker build -t weydub/pro-subtitle-removal:1.1.0 .
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
        "weydub/pro-subtitle-removal:1.1.0"
      ]
    }
  }
}
```

Start with no credentials to try `preview_removal`. It checks the link format locally; it does not fetch the video, preview cleaned frames or spend credits. For actual jobs, make your [Weydub API credentials](https://weydub.com/docs/api/) available as `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` in the environment of the MCP client that launches Docker. A desktop app opened from a launcher may not inherit your shell environment. Use its secret settings or start it from the configured environment. Do not paste keys into chat. The container needs outbound HTTPS to `api.zhaoli.com`, Weydub's processing service.

## Try a local MP4 without a key

Create a dedicated folder for one clip and put the video there as `input.mp4`. Use an H.264 MP4 up to 60 seconds and 16 MiB, with optional AAC audio. The [captioned practice clip](../../examples/full-frame-removal/) works too. In the Docker arguments above, insert `"--mount", "type=bind,src=/absolute/path/to/your/clip-folder,dst=/clip"` immediately **before** the image name and add `"/clip"` **after** the image name. Restart the MCP connection. The folder must be writable by the container; on Linux, add `--user` and your numeric `UID:GID` before the image if necessary. Mount only the clip folder.

1. Ask the client to run `submit_trial_clip` after you confirm that Weydub may process `input.mp4`. It saves a private receipt and uploads the file for full-frame Pro processing.
2. Ask for `save_trial_result`. If it reports `queued` or `processing`, use the same tool and folder later, even after restarting the client. When it reports `downloaded`, play `cleaned.mp4`. Existing files are never overwritten.
3. Keep `.weydub-receipt` private. Use a different folder for each clip. The trial shares 100 clips per UTC month with the other anonymous integrations and never switches to your paid account. If you cannot mount a local folder, [try your clip in the browser](https://huggingface.co/spaces/iniu/weydub-media-localization).

## Clean a clip with your own credits

1. Give `preview_removal` a direct HTTPS link to a video you own or may process. A social post, local file path or link that requires signing in is not a direct video link. When using a temporary media link, leave it valid long enough for the service to fetch the clip.
2. When you are ready, approve **one** `submit_removal` call with `confirm_charge: true`. Each new submission can spend credits on your [Weydub account](https://weydub.com/vip/pricing-detail/). Save the `work_id` it returns. If the connection times out before you get an ID, check your Weydub task history before submitting again; this adapter cannot deduplicate a second request.
3. Call `check_removal` with the saved `work_id` (as a string). If it says `processing`, check the same ID later. When it says `ready`, open the private `download_url` and save the MP4. Checking status never starts a second job. Treat the result link as private.

**Support and security reports:** Contact the Weydub team privately at `niumo@weydub.com`. Include the adapter version and what happened; omit API credentials, private video links and download links.
