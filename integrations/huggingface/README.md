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
| Remove subtitles (Pro) | Video with burned-in text anywhere in the picture; no box or language selection needed | Cleaned MP4. Full-frame detection can also remove signs, labels or prices; use the [Weydub editor](https://weydub.com/subtitle-removal/) for selective removal. |
| Extract subtitles | Video with visible text, plus the language on screen | Timed SRT from full-frame OCR |
| Dub video | Video with speech you have permission to translate, spoken and target languages | Video with translated speech and captions |
| Translate image | Downloadable image URL, visible and target languages | Translated image with the wording rendered back into the picture |

**Try it without credits:** the first screen shows the same video frame before and after subtitle removal. Paste a direct HTTPS link to a video you may process and click **Preview request** to see the full-frame Pro settings. To try a request without supplying any file, select **Translate image** and preview the provided Chinese product poster. Neither preview fetches the source or spends credits. The dubbing clip is a published product demo; the downloadable example SRT illustrates the output format.

**Use your own processing credits:** duplicate the Space into your **personal** Hugging Face account and select **Private** visibility. In the duplicate's Settings, add `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` as *Secrets*, and set the variable `WEYDUB_ENABLE_LIVE` to `1`. Sign in with the same Hugging Face account that owns the duplicate. The supplied code does not accept credentials from a web form. Owner-only live controls are disabled in the original public Space and when native Hugging Face OAuth is unavailable. There is no shared demo processing balance.

Each click on **Submit one file** requests one billable Weydub task. Full-frame Pro uses the Pro rate on your Weydub account. The app signs requests on the server; it does not include the App Secret in a request to the processing API. Save the job ID and use **Get result** to check progress without starting another task. When it finishes, open the download link and save the file. If a finished job is locked for insufficient credits, top up and check the same ID. [Processing prices](https://weydub.com/vip/pricing-detail/) · [API guide](https://weydub.com/docs/api/).

**Repository build:** from the GitHub repository root run `node integrations/huggingface/stage.mjs /path/to/new-empty-directory`. The command includes only listed public files and the existing Python integration contract. From the staged directory run `python -m pip install -r requirements.txt` and `python app.py`. The local app is preview-only. This build is what should be pushed to a Space repository.

**Create your own Space from the release:** download `weydub-space.zip` from the [Weydub Space release](https://github.com/JollyToday/GhostCut-auto_video_translation/releases/tag/weydub-space-v1.1.0) and unzip it. In your Hugging Face account create a private **Gradio** Space using **CPU Basic**. Upload the extracted files together at the repository root so `app.py` is beside `README.md`. Start with **Preview request**, then configure your credentials as described above to process a file.
