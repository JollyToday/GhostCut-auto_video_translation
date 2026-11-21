# Install Weydub Pro Subtitle Removal in Cline

Use this installation to check that Cline can reach the server. No Weydub account or video is needed to install it. Processing takes place on Weydub only when you later submit a job.

1. Start Docker. In a new directory, get the published adapter and build its local image:

   ```sh
   git clone --depth 1 https://github.com/JollyToday/GhostCut-auto_video_translation.git
   docker build -t weydub-pro-removal:1.0.0 GhostCut-auto_video_translation/integrations/pro-removal-mcp
   ```

2. In an interactive terminal, run:

   ```sh
   cline mcp install weydub-pro-removal -- docker run --rm -i --read-only --cap-drop=ALL --security-opt=no-new-privileges -e WEYDUB_APP_KEY -e WEYDUB_APP_SECRET weydub-pro-removal:1.0.0
   ```

   Accept the name, **Local** server type and Docker command. Leave the final environment field empty. The wizard should say it added `weydub-pro-removal`. If it already exists, use `cline mcp` to inspect or edit that entry instead of adding another. For a Cline edition without this CLI wizard, merge the single server entry from the [README](README.md) into the MCP settings using the app.

3. Open a new Cline session and ask: **“Use `preview_removal` only with `https://example.com/sample.mp4`. What settings would be used?”** The expected answer is Pro, full frame, with no charge. This example link does not need to host a video. Preview checks its format, not whether the file is reachable. This finishes the installation test.

To process your own clip, make your Weydub credentials available to the Cline process as `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` before starting a new session. Keep the values out of chat and shared settings. Provide a reachable HTTPS link to media you may process, approve one billable `submit_removal` call, then save the work ID. Use `check_removal` with that ID to get the finished MP4. If submission times out, check your Weydub history before sending the clip again.

Full-frame removal can affect signs and price labels. Compare [original](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) and [cleaned](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp) frames, or [use the area selector](https://weydub.com/subtitle-removal/) to protect text outside the caption band.
