# Weydub Pro Subtitle Removal

When a supplier sends a video with captions already burned into the picture, switching off the subtitle track won't help. This plugin takes a direct video link and returns a cleaned video so you can add your own captions. Pro looks for text throughout the frame, even when the caption position changes. Lite is also available and uses the same full-frame area. Both can remove signs and labels as well as captions; try a representative clip before processing a series.

See [before-and-after examples on Weydub](https://weydub.com/subtitle-removal/). For batch uploads or selecting a region instead of scanning the entire picture, use the browser workflow on that page.

### Install in Claude Code

```text
/plugin marketplace add JollyToday/GhostCut-auto_video_translation
/plugin install weydub@weydub-plugins
```

Run `/weydub:pro-subtitle-removal` and ask: “Preview Pro removal for this video. Tell me what will be sent before starting a job.” You need Node.js 20 or later. Previewing is local and free. For processing, set your own `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` in the environment that starts the client. Keep them out of messages.

### Install the skill in another agent

```sh
npx skills add https://github.com/JollyToday/GhostCut-auto_video_translation/tree/main/plugins/weydub/skills/pro-subtitle-removal
```

Give the agent a direct HTTPS link to a video you are authorized to process. Tell it when to submit. Save the returned work ID to retrieve the result without paying to process the clip twice. The extension has no subscription of its own: processing uses your [Weydub account's credit rates](https://weydub.com/vip/pricing-detail/). [API documentation](https://weydub.com/docs/api/).

For a first run, use [the 15-second coffee audition clip](https://weydub.com/creator-kit/clips/wrong-cup/en.mp4?v=c6a45c49c92e). To review an example before spending credits, compare [original stills](https://weydub.com/creator-kit/comparison/comedy-original-grid.webp) with [the same stills after removal](https://weydub.com/creator-kit/comparison/comedy-clean-grid.webp).
