---
name: pro-subtitle-removal
description: Remove subtitles burned into a video picture, or retrieve a cleaned MP4 from a Weydub work ID. Use for hardcoded captions, not removable subtitle tracks.
---

Start by determining whether the text is baked into the image. If turning off the subtitle track removes it, explain that the user can disable the track without using credits. For embedded text, full-frame Pro can also erase signs and prices. For a caption band only, recommend [the Weydub editor](https://weydub.com/subtitle-removal/).

If the plugin's `preview_removal` tool is available, preview the direct HTTPS media link without fetching it or spending credits. Tell the user the model and scope. Only call `submit_removal` with `confirm_charge: true` after the user approves spending their Weydub credits on that particular clip. Record the returned work ID. Use `check_removal` with the same ID until ready, then give the user the private MP4 link. If submission is uncertain, tell them to check Weydub task history; do not resubmit automatically.

Credentials belong in the plugin's sensitive settings, never in the conversation. If local MCP tools are unavailable on this Claude surface, explain that the video has not been processed. Link to the [online editor](https://weydub.com/subtitle-removal/) for processing and [original](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) and [cleaned](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp) frames for comparison.
