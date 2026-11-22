---
name: pro-subtitle-removal
description: Remove burned-in captions from a local short MP4 without a key, or process a video URL using a Weydub account. Retrieve a cleaned video by private trial receipt or paid work ID.
---

Start by determining whether the text is baked into the image. If turning off the subtitle track removes it, explain that the user can disable the track without using credits. For embedded text, full-frame Pro can also erase signs and prices. For a caption band only, recommend [the Weydub editor](https://weydub.com/subtitle-removal/).

**Local MP4, no key:** In Claude Code, offer the sponsored trial for an H.264 MP4 up to 60 seconds and 16 MiB. Identify the exact file and obtain permission to upload it to Weydub. Select a new receipt filename in a private directory outside the project. Keep track of that path, never read the receipt into the conversation, and reuse it for that clip. Run the following with the user's actual paths, quoting each argument:

```sh
node "${CLAUDE_SKILL_DIR}/trial.mjs" submit "clip.mp4" "private-receipt.txt" --confirm-upload
node "${CLAUDE_SKILL_DIR}/trial.mjs" status "private-receipt.txt"
node "${CLAUDE_SKILL_DIR}/trial.mjs" download "private-receipt.txt" "clip-cleaned.mp4"
```

After submitting, check the receipt. Download when `ready`, and give the user the path only after `downloaded`. The output filename must be unused. If interrupted, resume with the original receipt. If the service reports `failed`, `needs_review`, `expired` or exhausted capacity, explain the outcome. Anonymous channels share 100 sponsored submissions per UTC month. Do not switch a trial to paid processing automatically.

**Video URL, user's account:** If the plugin's `preview_removal` tool is available, preview the direct HTTPS media link without fetching it or spending credits. Tell the user the model and scope. Only call `submit_removal` with `confirm_charge: true` after the user approves spending their Weydub credits on that particular clip. Record the returned work ID. Use `check_removal` with the same ID until ready, then give the user the private MP4 link. If submission is uncertain, tell them to check Weydub task history; do not resubmit automatically.

Credentials belong in the plugin's sensitive settings, never in the conversation. On a surface without local commands or the relevant processing tools, explain that the video has not been processed. Link to the [online editor](https://weydub.com/subtitle-removal/) for processing and the [licensed before-and-after example](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/examples/full-frame-removal) for comparison.
