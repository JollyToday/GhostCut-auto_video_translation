---
title: Weydub Media Localization Lab
sdk: gradio
sdk_version: 6.32.0
app_file: app.py
python_version: "3.12"
hf_oauth: true
colorFrom: indigo
colorTo: blue
short_description: Preview subtitle removal, OCR, dubbing and image translation
---

# Weydub Media Localization Lab

Compare [Weydub](https://weydub.com/) examples, inspect a signed-API request body without submitting it, or run one of four operations in your own Space. This is a client for a hosted service; it does not distribute model weights.

| Operation | Input | Output |
| --- | --- | --- |
| Remove subtitles | Video with burned-in text near the bottom of the frame | Cleaned video; the request uses Lite inpainting in the bottom 18% |
| Extract subtitles | Video with visible text, plus the language on screen | Timed SRT from full-frame OCR |
| Dub video | Video with speech you have permission to translate, spoken and target languages | Video with translated speech and captions |
| Translate image | Downloadable image URL, visible and target languages | Translated image with the wording rendered back into the picture |

**Public preview:** select an operation and inspect its sample. Build a request using your own downloadable HTTPS media link. Previewing does not download that file or submit a processing job. The removal and dubbing media are published product demonstrations linked from the corresponding Weydub pages; the removal comparison demonstrates Pro, not the Lite request. The example SRT is a hand-authored format fixture. The image is the public source image from the direct API guide. No private customer files or API keys are included.

**Use your own processing credits:** duplicate the Space into your **personal** Hugging Face account and select **Private** visibility. In the duplicate's Settings, add `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` as *Secrets*, and set the variable `WEYDUB_ENABLE_LIVE` to `1`. Sign in with the same Hugging Face account that owns the duplicate. The supplied code does not accept credentials from a web form. Owner-only live controls are disabled in the original public Space and when native Hugging Face OAuth is unavailable. There is no shared demo processing balance.

Each click on **Submit one file** requests one billable task. Save the returned ID and use **Get result** to poll it. Do not submit the same source again to check progress. On success, open the output URL and store the file in your own storage. [Processing prices](https://weydub.com/vip/pricing-detail/) · [API guide](https://weydub.com/docs/api/).

**Repository build:** from the GitHub repository root run `node integrations/huggingface/stage.mjs /path/to/new-empty-directory`. The command includes only listed public files and the existing Python integration contract. From the staged directory run `python -m pip install -r requirements.txt` and `python app.py`. The local app is preview-only. This build is what should be pushed to a Space repository.
