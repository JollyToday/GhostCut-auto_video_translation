[English](README.md) | [中文](README_cn.md)

> **International users:** Use [Weydub Video Translator](https://weydub.com/video-translator/) and the [Weydub API docs](https://weydub.com/docs/api/). Weydub is the international version of GhostCut; this repository keeps the historical GhostCut project name for compatibility, and older screenshots/GIFs may still show the original domestic brand.

## Welcome to Weydub

### Try the media API

Coming from RapidAPI? To turn text printed in an MP4 into an editable SRT, open [Weydub Subtitle Extraction](https://rapidapi.com/jollytoday-jollytoday-default/api/weydub-subtitle-extraction). The [marketplace quickstart](examples/rapidapi.md) covers account linking, file uploads and downloads, and links to the other listings. The Postman collection and CLI below are for **direct Weydub credentials**.

In Postman, [open the public collection](https://www.postman.com/niumo-136777cf-7015050/weydub-media-api/collection/01a3zbt/weydub-media-localization-api-byo-credentials) and [follow one file from submission to download](examples/postman.md). For the CLI, use Node.js 20+ with no packages to install. Supply a video or image URL you control. The repository GIFs illustrate the product; they are not test inputs. The CLI previews a creation request by default. Add `--submit` only when you want to spend your own API credits:

```sh
node examples/media.mjs ocr "$VIDEO_URL" --source zh
node examples/media.mjs erase "$VIDEO_URL"
node examples/media.mjs dub "$VIDEO_URL" --source zh --target en
node examples/media.mjs image "$IMAGE_URL" --source zh --target en
```

Set `WEYDUB_APP_KEY` and `WEYDUB_APP_SECRET` locally for live calls. Save the returned job ID; use `video-status` for OCR, removal and dubbing, or `image-status` for images. Querying an existing ID does not submit a second processing job.

In [Apify Store, open the Weydub Actor](https://apify.com/weydub/weydub-media-localization) and run the default image example with **Submit a billable media job** off. Its dataset shows the request without spending Weydub credits. To translate your own image, enter its URL and your Weydub credentials, turn submission on, then choose **Check an image job** and enter the returned job ID to get the download link. Apify platform usage is separate.

To build a workflow without writing code, [install Weydub in your Make organization by invitation](https://www.make.com/en/hq/app-invitation/a4e2ee19d928e181b5dbbbd59c10a8ed) and [try one product image](integrations/make/README.md), or [install the release on self-hosted n8n](integrations/n8n/README.md). Use your own Weydub App Key and App Secret for live jobs. Make is available through the invite rather than the reviewed directory. The n8n package is for self-hosted installations; it is not a verified n8n Cloud node.

For MCP clients, [install the Weydub desktop extension and run your first job](mcp/README.md). Start by previewing a request, then use the returned job ID to download your SRT, processed video, or translated image.

[See Pro remove captions from the top, middle and bottom of a clip](examples/full-frame-removal/). Download the input and actual output to compare them, or use the same input to test your integration.

In Node-RED, [import the free subtitle removal flow](examples/node-red/) to submit an authorized local MP4 and download the cleaned video. The guide also includes a separate flow for your own Weydub API account.

The [Pipedream Connect action source](integrations/pipedream/) and offline tests are available for developers. The app has been submitted for registry review and is not yet available in Pipedream's public catalog.

To explore the four operations in a browser, [build the Gradio sample lab](integrations/huggingface/). It previews requests without credits and can run in a personal Hugging Face Space with owner-only processing.

OCR reads the full frame; choose the language visible on screen. The Lite removal example targets the bottom 18% of the picture. Dubbing translates speech and adds captions; original burned-in captions remain unless you remove them first. [API documentation](https://weydub.com/docs/api/) · [Credit rates](https://weydub.com/vip/pricing-detail/).

### Auto video localization tool, AI based, translate everything
Weydub is an automatic localization tool allowing you to translate videos into 40+ languages efficiently. With smart text/watermark removal and hard-subtitle translation, you can handle hard subtitles and improve efficiency by 100 times. GhostCut is the original domestic brand behind this repository.

Here are some video demos.

<img src="https://github.com/JollyToday/GhostCut-auto_video_translation/blob/main/FEAF76B7-CA91-42A0-9C95-905157295980.GIF" width="720"> 

### Historical Product Updates
* 10.12-# AI image tool launchend: Image Text Removal and Image Translator . Excellent effect, global leading, free to use.
* 09.26-#GhostCut Video Remaker update : new [advanced remaker] - support short drama remaker / commentary remaker
- Support AI one-click rewriting, regenerate copy, dubbing and subtitles according to the original content, and flexibly match deduplicate to greatly improve remaker ;
- Add subtitle position inference to effectively avoid erasure of scene text.
* 9.13- #GhostCuit and TiKTok Auto post release:
- Deduplicate function update : add a variety of deduplicate methods, random mirroring, random acceleration, color matching, etc., open head and tail, frame extraction and other operation options, users can customize deduplicate operation
- The work page adds TiKTok one-click posting function , which can be directly bound and post to TikTok account, authorized by the official interface, and the processed works can be published overseas with one click to TikTok
* 08.04-#GhostCutweb version update, simpler page layout, clearer introduction, web version supports various online adjustments, welcome to experience.
* 07.28-# API is open, GhostCut supports use of online API , more autonomous, simpler, and more combinations can be supported. The entrance is on the homepage of the web page. 
* 06.05- #618 Welfare Broadcast
- Benefit 1: The original quarterly membership package has been upgraded to a semi-annual one, with no price increase for overtime
- Benefit 2: Receive expired points. Purchasing any package can retrieve points that expire within 30 days.
* 05.14-#Translation product update: GhostCut has launched an online hard subtitle editing feature, which allows users to adjust the text content of hard subtitle translation on their computer.
* 04.18-#Translation product update: The mobile version of GhostCut has added the function to translate video sound and text, as well as adjust subtitle translation directly within the mobile app. Users can modify the text and style of their translated works without using a computer, and can also compare and adjust the copy of new and old videos.
* 04.17-#GhostCut Translation Update: Video speech translation segmental speed adjustment is now available, fully guaranteeing alignment between speech, picture, and subtitles. More precise alignment and stable pronunciation are achieved；
* 03.28-#GhostCut Website Update: Video Hard Sub Translation feature launched on the web version, with the ability to simultaneously translate video text and add intelligent background music in one go；
* 03.23-#GhostCut TTS Update: Update commonly used voices from editing apps such as Jianying (Douyin) and CapCut, such as Northeastern Iron, Guangxi Zhuanghan, English vitality Ariana；
* 03.15-#GhostCut API Update: Opened APIs for multiple exclusive products such as Video remaker, video text removal, Video Hard Sub Translation, and video translation and dubbing；
* 03.09-#GhostCut Translation Product Update: All translation engines used ChatGPT API, with higher accuracy, especially for translation between small  country languages；
* 01.16-#GhostCut Translation Product Update:  Video Hard Sub Translation product launched.

## 1. Weydub - AI Video Localization Tool
Weydub, the international version of GhostCut, is an intelligent video localization and editing tool. Its core purpose is to help customers improve the processing speed of materials and the quality of video creative production. We use AI capabilities across audio and video processing details to improve efficiency for many video workflows. It has several unique features, including automatic video translation and dubbing, automatic hard subtitle translation, automatic hard sub/text removal, intelligent video inpainting, and more. Every detail of this product is a combination of AI and automation.

These are some of our exclusive features.
1. **[Smart Text Removal]** Automatically detect all text/subtitles in the video through OCR and perform video inpainting to restore the erased video parts as much as possible;
2. **[Auto Hard Sub Translation]** Automatically detect the text/subtitles in the video through OCR, calculate and extract text position, style, size in the video, and then use ChatGPT to translate the subtitles and paste them back according to the original text style and position, while performing inpainting on the original text area;
3. **[Auto Translation and dubbing]** Automatically extract the voice in the video through ASR and translate it, while using TTS to synthesize the translated text into voice. In this process, the position of the original picture, voice, and subtitles is calculated, and the newly synthesized voice, subtitles, and original picture are automatically aligned to ensure the consistency of sound and picture. You can choose whether to perform inpainting smudging on the original text and whether to retain the original sound. The effect of retaining the original sound is to automatically separate the human voice and background music of the original video and retain the background music.
4. **[Auto Video remaker]** Automatically make minor modifications to the video, and automatically complete the following operations, including but not limited to modifying md5, removing video fingerprints, superimposing picture-in-picture in the video, minor cropping, using Gaussian blur, automatic cover clipping, slightly tilting the picture, using sharpening, using acceleration and deceleration, and other transitions, filters, scaling, etc. Generally used for quick secondary creation for **short video**.
5. **[Image Translator and text removal]** Weydub image translation service is an AI image translation product. It integrates multiple latest AI models, optimizes translation quality, style layout, and text backfilling as a whole, and improves picture translation quality to a new level.

## 2. Product Features
1.Weydub uses the latest AI technologies plus audio and video processing algorithms to improve processing effects as much as possible;

2.Adopt automated and intelligent design concepts, end-to-end problem solving, and deliver finished products as much as possible;

3.All APIs and intermediate products are open for easy integration.

## 3. Video Demos
[Try Weydub Video Translator](https://weydub.com/video-translator/ "Try Weydub Video Translator")
For international users, use Weydub on the web. Mainland China users can still access the domestic GhostCut product in the WeChat mini program.

### Smart Text Removal- video demos
<img src="https://github.com/JollyToday/GhostCut-auto_video_translation/blob/main/4AF80FA6-B2CE-44A0-9123-CEE40423CC60.GIF" width="720"> 

This is a smart text removal and video inpainting demo. Compared to other text removal software, such as Runway's inpainting feature, Weydub/GhostCut text removal is designed to be simple, smart, and cost effective. You can start from [Weydub Subtitle Removal](https://weydub.com/subtitle-removal/ "Weydub Subtitle Removal").


**What kind of text can Weydub automatically remove?**
Specifically as follows 
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1680243681313.png" width="720">

### Video Hardcode subtitles Translation-video samples
<img src="https://github.com/JollyToday/GhostCut-auto_video_translation/blob/main/1F0B7143-A92C-4C52-BB16-82EEA231DFD4.GIF" width="720"> 

Weydub hard subtitle translation recognizes the text in the original video by OCR and generates translated text. It also uses AI to remove the original video text, and then re-pastes the translated text back into the original text position, while trying to retain the original text size, color, and layout as much as possible. Compared with using multiple editing and translation tools, Weydub focuses on automation, one-click original text removal, and preserving the original video text layout.

### Video Translation and Dubbing-video samples
The translated video comes with synchronized voiceover, please click here to view the video effect YouTube Video Voice Translation Case

[Weydub/GhostCut video translation with both voice and text](https://youtu.be/6CCI5ZA-3JE "Weydub/GhostCut video translation with both voice and text")

## 4. Specific AI Editing Capabilities
### [Video Micro-Editing/Video remaker Details](https://github.com/JollyToday/GhostCut_remake_Video/blob/main/README_en.md "GhostCut Video remaker info")
* Support basic Video remaker, one-time basic micro-cropping
* Support overlay video special effects
1.Scan light effects
2.Glare opening effects
3.Descending opening effects
4.Book list mode effects
5.Dissolving mode effects
6.Horizontal video three-screen display effects
7.Good things effects
8.Film and television effects 
* Support overlay random transitions, random scaling, random borders, mirror reversal
* Support algorithmic automatic music matching, calculate the rhythm of the original video and *automatically match music with similar rhythm
* Support matching specified music
* Support re-write the captions and AI dubbing
* Support change the subtitles fonts and style

### [Text Removal and Video Inpainting Details](https://github.com/JollyToday/GhostCut_Remove_Video_Text/blob/main/README.md "GhostCut remove video text info")
* Support automatic text removal, first mark the area and only automatically remove the text in marked area, remove all after marking the area, adjust the protection or erasure area and re-synthesize
* Support removal of moving text/moving text watermark
* Support automatic detection of video subject and upper and lower edges, and refill the background outside the video main subject

### Video Translation And Dubbing Details
* Support ASR to extract video voice and translate
* When ASR extracts video sound, separate human voice and background sound, and only translate human voice
* Support mute after translation, or retain background sound, or algorithmic music matching or specified music matching
* Support only generate translated subtitles (without TTS synthesis)
* Support translation subtitles and TTS voice synthesis (automatically calculate the position of subtitles, pictures, and sound during synthesis)

### Video Hard subtitles Translation Details
* Support OCR to extract video text and translate
* When OCR extracts video text, support text position and style extraction
* TTS synthesis for translated text will be supported soon.

### [Image translation Details](https://github.com/JollyToday/AI_Image_Translator_Translate_Images/blob/main/README-EN.md "GhostCut Image Transltor info")
* Clean erasure
* Neat typography
* Picture Clarity
* Translation Accuracy
* 100+ languages support
* Product text protection
* Vertical support
* Multi-line support
* API support
* Private deployment
  
## 5. Technical Details
* Voice: Self-developed ASR and TTS combined with engines such as iFlytek, Alibaba Cloud, Google, Microsoft, and ByteDance Volcano; 
* Translation: Comprehensive use of iFlytek, Deepl, ChatGPT translation, etc.;

## 6. Supported Languages for Translation
* Smart Text Removal: Remove both Chinese and English at the same time, or remove Chinese, English, Japanese, Korean, and Arabic separately; 
* Auto Video Hard Sub Translation: Source language: Chinese or English; Target language: Chinese/English/Japanese/Indonesian/Portuguese/French/Spanish/Hindi/Arabic/Vietnamese/Thai/German/Russian/Turkish/Italian/Philippines/Malaysia/Khmer 
* Auto Video Translation and Dubbing: Source language: Chinese/English/Japanese/Korean/Spanish/Italian/Russian/French/Portuguese/Vietnamese/Thai, etc.; Target language: Chinese/English/Japanese/Indonesian/Portuguese/French/Spanish/Hindi/Arabic/Vietnamese/Thai/German/Russian/Turkish/Italian/Vietnamese
* Image Translation:100+ languages

## 7. API Interface Support
* 1.Provides output for all the above capabilities, including Video remaker and editing, automatic text removal, video erasure, video subtitle translation, video voice translation (including dubbing), and other interfaces. Multiple capabilities can be stacked and selected together;
* 2.Text removal supports the following four modes, and you can customize the protection area or specify the deletion area:

> a. Automatic text removal

> b. First mark the specified area, and then automatically remove the text in the specified area

> c. First mark the area, and then remove all the contents of the marked area

> d. After removing the text, adjust the specified area later

* 3.Video translation can be used together with multiple editing capabilities: One-click completion: Video remaker + automatic text removal + video translation + video music matching and other operations (including translated dubbing)
* 4.[Weydub Video Translation API documents](https://weydub.com/docs/api/video-translation.html "Weydub Video Translation API documents")
* 5.[Weydub API and automation guides](https://weydub.com/docs/api/ "Weydub API and automation guides")

## 8. Contact Us
* For international product access, start from [Weydub](https://weydub.com/).
* WeChat: 360254, please indicate GitHub in the remark.
* Email：niumoz#izhaoli.com（#-->@）
