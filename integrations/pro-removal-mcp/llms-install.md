# Install Weydub Pro Subtitle Removal in Cline

## With Node.js (no Docker)

With Node.js 22 or newer and Cline CLI installed, run:

```sh
cline mcp install weydub-pro-removal --yes --json -- npx -y --package https://github.com/JollyToday/GhostCut-auto_video_translation/releases/download/weydub-pro-cli-v1.1.1/weydub-pro-removal-mcp-1.1.1.tgz weydub-pro-removal
```

For the Cline extension, use `npx` as the MCP command, with four arguments: `-y`, `--package`, the complete `.tgz` URL above, and `weydub-pro-removal`. The archive includes its runtime dependencies. If you already have a working Docker registration with this name, keep it or edit the existing entry; you only need one installation.

1. Reconnect Cline. In your home folder, open `Weydub-Trial` and put the clip you may process there as `input.mp4`. Use H.264 MP4, optional AAC audio, up to 60 seconds and 16 MiB.
2. Tell Cline: **“I have permission to send input.mp4 to Weydub. Use `submit_trial_clip` to remove its burned-in subtitles, then use `save_trial_result`.”** The trial uses full-frame Pro. Text on signs, prices or logos may also be removed. Compare [before and after](https://weydub.com/subtitle-removal/) before choosing full-frame processing.
3. When the tool reports `downloaded`, open `cleaned.mp4` beside the input. If the job is still processing or Cline restarts, ask for `save_trial_result` again. Keep that folder and its private receipt together. Downloads never replace an existing file.

For another clip, append the absolute path of a different, existing dedicated folder as the final `npx` argument. The trial is shared across anonymous integrations (100 clips per UTC month); a full pool never spends your credits. Use the [Weydub editor](https://weydub.com/subtitle-removal/) for batches, longer clips or a specific caption area. To use account credits from Cline, see the instructions below.

## With Docker

1. Start Docker. [Download and load the image for your computer](README.md#run-locally-with-docker), then go straight to step 2. To build the same adapter from source instead, run this as **one shell command** in a new directory. Wait for the load or build to finish before registering the server; Cline can save a registration even when the image is missing.

   ```sh
   git clone --branch weydub-pro-container-v1.1.0 --depth 1 --filter=blob:none --no-checkout https://github.com/JollyToday/GhostCut-auto_video_translation.git && \
   git -C GhostCut-auto_video_translation sparse-checkout set --no-cone '/integrations/pro-removal-mcp/' && \
   git -C GhostCut-auto_video_translation checkout && \
   docker build -t weydub/pro-subtitle-removal:1.1.0 GhostCut-auto_video_translation/integrations/pro-removal-mcp
   ```

2. Register the local server. On Cline CLI 3.0.75 this command works without opening a wizard. If you already configured `weydub-pro-removal`, inspect that entry with `cline config mcp` before running the command again; it may contain settings you want to keep.

   ```sh
   cline mcp install weydub-pro-removal --yes --json -- docker run --rm -i --pull=never --read-only --cap-drop=ALL --security-opt=no-new-privileges -e WEYDUB_APP_KEY -e WEYDUB_APP_SECRET weydub/pro-subtitle-removal:1.1.0
   ```

   Look for `"name":"weydub-pro-removal"` and `"status":"installed"` in the response. This registers the command; the preview in the next step checks that the server actually starts. If `cline mcp install --help` does not list `--yes`, omit `--yes --json` and follow the interactive wizard. Accept the name, **Local** server type and Docker command; leave the final environment field empty. For the editor extension without the CLI, merge just the server entry from the [README](README.md) into the MCP settings in the app.

3. Open a new Cline session and ask: **“Use `preview_removal` only with `https://example.com/sample.mp4`. What settings would be used?”** The expected answer is Pro, full frame, with no charge. This example link does not need to host a video. Preview checks its format, not whether the file is reachable. This finishes the installation test.

**Try a local clip for free.** Create a dedicated folder containing just your authorized `input.mp4` (H.264, up to 60 seconds and 16 MiB). For a new installation, use the following registration **instead of step 2**. Replace the example absolute path with the clip folder. For an existing installation edit its Docker arguments instead of adding another server.

```sh
cline mcp install weydub-pro-removal --yes --json -- docker run --rm -i --pull=never --read-only --cap-drop=ALL --security-opt=no-new-privileges --mount "type=bind,src=/absolute/path/to/your/clip-folder,dst=/clip" weydub/pro-subtitle-removal:1.1.0 /clip
```

In Cline say: **“I may send input.mp4 to Weydub. Use `submit_trial_clip`, then `save_trial_result` to save the cleaned video.”** Come back to the same folder if it is still processing. The receipt stays there; the finished file is `cleaned.mp4`. This uses the shared sponsored allowance and no API key. [Folder permissions and trial limits](README.md#try-a-local-mp4-without-a-key).

**Use your own credits for a video URL.** Make your Weydub credentials available to the Cline process as `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` before starting a new session. Keep the values out of chat and shared settings. Provide a reachable HTTPS link to media you may process, approve one billable `submit_removal` call, then save the work ID. Use `check_removal` with that ID to get the finished MP4. If submission times out, check your Weydub history before sending the clip again.

Full-frame removal can affect signs and price labels. Compare [original](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) and [cleaned](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp) frames, or [use the area selector](https://weydub.com/subtitle-removal/) to protect text outside the caption band.
