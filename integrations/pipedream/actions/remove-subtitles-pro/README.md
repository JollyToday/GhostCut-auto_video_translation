# Overview

Use **Remove Burned-In Subtitles (Full-Frame Pro)** when captions are part of the picture and appear in different places across a clip. Pro can erase a shop sign, a price or a product label too. To keep those details, [choose a smaller area in the Weydub editor](https://weydub.com/subtitle-removal/).

# Example Use Cases

A creator wants to add English captions to a vertical video, but the original subtitles move from the top of one shot to the middle of the next. Try the [before-and-after clip](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/c4d72c4/examples/full-frame-removal) first. Compare the same frames to see which text disappeared before sending your own video.

# Getting Started

1. Choose your Weydub API connection. Enter a direct HTTPS link to video you have permission to edit. To try a known input, use the [15-second captioned MP4](https://raw.githubusercontent.com/JollyToday/GhostCut-auto_video_translation/c4d72c4/examples/full-frame-removal/input.mp4).
2. Leave **Submit Billable Job** off for a free settings check. It does not produce a video. To process the clip, switch it on and run the action once. This spends credits on the connected Weydub account. Save `jobId` as a string.
3. In **Get Video or OCR Result**, enter that ID, select **Video (MP4)** under **Expected Output** and use the same connection. When `status` is `1`, download `videoUrl`. To see the outcome without processing a clip, [compare the original and actual Pro output](https://github.com/JollyToday/GhostCut-auto_video_translation/tree/c4d72c4/examples/full-frame-removal).

# Troubleshooting

If the request times out before showing an ID, check your Weydub task history before running it again. If you already have the ID, repeat only the result lookup. A new submission can spend credits a second time.
