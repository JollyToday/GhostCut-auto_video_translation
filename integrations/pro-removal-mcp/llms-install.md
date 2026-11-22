# Install Weydub Pro Subtitle Removal in Cline

Use this installation to check that Cline can reach the server. No Weydub account or video is needed to install it. Processing takes place on Weydub only when you later submit a job.

1. Start Docker. [Download and load the image for your computer](README.md#run-locally-with-docker), then go straight to step 2. To build the same adapter from source instead, run this as **one shell command** in a new directory. Wait for the load or build to finish before registering the server; Cline can save a registration even when the image is missing.

   ```sh
   git clone --depth 1 --filter=blob:none --no-checkout https://github.com/JollyToday/GhostCut-auto_video_translation.git && \
   git -C GhostCut-auto_video_translation sparse-checkout set --no-cone '/integrations/pro-removal-mcp/' && \
   git -C GhostCut-auto_video_translation checkout && \
   docker build -t weydub/pro-subtitle-removal:1.0.0 GhostCut-auto_video_translation/integrations/pro-removal-mcp
   ```

2. Register the local server. On Cline CLI 3.0.75 this command works without opening a wizard. If you already configured `weydub-pro-removal`, inspect that entry with `cline config mcp` before running the command again; it may contain settings you want to keep.

   ```sh
   cline mcp install weydub-pro-removal --yes --json -- docker run --rm -i --pull=never --read-only --cap-drop=ALL --security-opt=no-new-privileges -e WEYDUB_APP_KEY -e WEYDUB_APP_SECRET weydub/pro-subtitle-removal:1.0.0
   ```

   Look for `"name":"weydub-pro-removal"` and `"status":"installed"` in the response. This registers the command; the preview in the next step checks that the server actually starts. If `cline mcp install --help` does not list `--yes`, omit `--yes --json` and follow the interactive wizard. Accept the name, **Local** server type and Docker command; leave the final environment field empty. For the editor extension without the CLI, merge just the server entry from the [README](README.md) into the MCP settings in the app.

3. Open a new Cline session and ask: **“Use `preview_removal` only with `https://example.com/sample.mp4`. What settings would be used?”** The expected answer is Pro, full frame, with no charge. This example link does not need to host a video. Preview checks its format, not whether the file is reachable. This finishes the installation test.

To process your own clip, make your Weydub credentials available to the Cline process as `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` before starting a new session. Keep the values out of chat and shared settings. Provide a reachable HTTPS link to media you may process, approve one billable `submit_removal` call, then save the work ID. Use `check_removal` with that ID to get the finished MP4. If submission times out, check your Weydub history before sending the clip again.

Full-frame removal can affect signs and price labels. Compare [original](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) and [cleaned](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp) frames, or [use the area selector](https://weydub.com/subtitle-removal/) to protect text outside the caption band.
