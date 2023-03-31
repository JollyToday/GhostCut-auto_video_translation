## [English Version](https://github.com/JollyToday/GhostCut/blob/main/README.md "GhostCut English info")  ---- [中文版](https://github.com/JollyToday/GhostCut/blob/main/README_cn.md "鬼手剪辑中文介绍") 

<img src="https://github.com/JollyToday/GhostCut/blob/main/auto%20video%20translation%20demo.GIF?raw=true" width="480"> 

### Latest Product Updates
* 03.23-#GhostCut TTS Update: Update commonly used voices from editing apps such as Jianying (Douyin) and CapCut, such as Northeastern Iron, Guangxi Zhuanghan, English vitality Ariana;
* 03.15-#GhostCut API Update: Opened APIs for multiple exclusive products such as video deduplication, video text removal, video text translation, and video voice translation;
* 03.09-#GhostCut Translation Product Update: All translation engines used ChatGPT API, with higher accuracy, especially for translation between small  country languages;
* 01.16-#GhostCut Translation Product Update:  Video Text Auto Translation product launched.

## 1. GhostCut - AI Video Editing Tool
GhostCut is an intelligent video editing software. Its core purpose is to help customers improve the processing speed of materials and the quality of video creativity. We have used a lot of AI capabilities in various audio and video processing details to improve the processing efficiency of many videos.

1. **[Video Text auto Removal]** Automatically detect all text/subtitles in the video through OCR and perform video inpainting to restore the erased video parts as much as possible;
2. **[Video Text Auto Translation]** Automatically detect the text/subtitles in the video through OCR, calculate and extract text position, style, size in the video, and then use ChatGPT to translate the subtitles and paste them back according to the original text style and position, while performing inpainting on the original text area;
3. **[Video Voice Auto Translation]** Automatically extract the voice in the video through ASR and translate it, while using TTS to synthesize the translated text into voice. In this process, the position of the original picture, voice, and subtitles is calculated, and the newly synthesized voice, subtitles, and original picture are automatically aligned to ensure the consistency of sound and picture. You can choose whether to perform inpainting smudging on the original text and whether to retain the original sound. The effect of retaining the original sound is to automatically separate the human voice and background music of the original video and retain the background music.
4. **[Auto Video Deduplication]** Automatically make minor modifications to the video, and automatically complete the following operations, including but not limited to modifying md5, removing video fingerprints, superimposing picture-in-picture in the video, minor cropping, using Gaussian blur, automatic cover clipping, slightly tilting the picture, using sharpening, using acceleration and deceleration, and other transitions, filters, scaling, etc. Generally used for quick secondary creation for **short video**.

## 2. Product Features
1.GhostCut Use lots of the latest AI technologies + audio and video processing algorithms to improve processing effects as much as possible;
2.Adopt automated and intelligent design concepts, end-to-end problem solving, and deliver finished products as much as possible;
3.All APIs and intermediate products are open for easy integration.

## 3. Video Cases
[GhostCut products Test](https://ghostcut.jollytoday.com/index/cn?redirect=%2Fhome/cn&code=th741 "GhostCut test")
There are Chinese and English versions. Mainland users can access product in  WeChat mini program, search GhostCut.

### Video Text Auto Removal- video samples
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595877.jpg" width="720"> 
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595884.jpg" width="720">

[YouTube automatically detect and remove text](https://youtu.be/uFBkMXQokMk "GhostCut can remove the video text automatically"),
please click here to view the video samples in YouTube

**What kind of  texts can GhostCut automatically remove ?**
Specifically as follows 
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1680243681313.png" width="720">

### Video Text Auto Translation-video samples
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595888.jpg" width="720">
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595887.jpg" width="720">

The style of the translated video text remains unchanged, please click here to view the video effect YouTube Video Text Translation Case
[YouTube -Video Text Auto Translation](https://youtu.be/VDXR6y7-pBg "GhostCut translate the video text automatically")

### Video Voice Auto Translation-video samples
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595889.jpg" width="720">

The translated video comes with synchronized voiceover, please click here to view the video effect YouTube Video Voice Translation Case
[YouTube Video Voice Auto Translation](https://youtu.be/3w7GJjg5C0Q?t=80 "GhostCut translate the video with both voice and text")

## 4. Specific AI Editing Capabilities
### Video Micro-Editing/Video Deduplication Details
* Support basic video deduplication, one-time basic micro-cropping
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

### Text Removal and Video Inpainting Details
* Support automatic text removal, first mark the area and only automatically remove the text in marked area, remove all after marking the area, adjust the protection or erasure area and re-synthesize
* Support removal of moving text/moving text watermark
* Support automatic detection of video subject and upper and lower edges, and refill the background outside the video main subject

### Video Voice Translation Details
* Support ASR to extract video voice and translate
* When ASR extracts video sound, separate human voice and background sound, and only translate human voice
* Support mute after translation, or retain background sound, or algorithmic music matching or specified music matching
* Support only generate translated subtitles (without TTS synthesis)
* Support translation subtitles and TTS voice synthesis (automatically calculate the position of subtitles, pictures, and sound during synthesis)

### Video Text Translation Details
* Support OCR to extract video text and translate
* When OCR extracts video text, support text position and style extraction
* TTS synthesis for translated text will be supported soon.

## 5. Technical Details
* Voice: Self-developed ASR and TTS combined with engines such as iFlytek, Alibaba Cloud, Google, Microsoft, and ByteDance Volcano; 
* Translation: Comprehensive use of iFlytek, Deepl, ChatGPT translation, etc.;

## 6. Supported Languages for Translation
* Intelligent Video Text Removal: Remove both Chinese and English at the same time, or remove Chinese, English, Japanese, Korean, and Arabic separately; 
* Auto Video Text Translation: Source language: Chinese or English; Target language: Chinese/English/Japanese/Indonesian/Portuguese/French/Spanish/Hindi/Arabic/Vietnamese/Thai/German/Russian/Turkish/Italian/Philippines/Malaysia/Khmer 
* Auto Video Voice Translation: Source language: Chinese/English/Japanese/Korean/Spanish/Italian/Russian/French/Portuguese/Vietnamese/Thai, etc.; Target language: Chinese/English/Japanese/Indonesian/Portuguese/French/Spanish/Hindi/Arabic/Vietnamese/Thai/German/Russian/Turkish/Italian/Vietnamese

## 7. API Interface Support
* 1.Provides output for all the above capabilities, including video deduplication and editing, automatic text removal, video erasure, video subtitle translation, video voice translation (including dubbing), and other interfaces. Multiple capabilities can be stacked and selected together;
* 2.Text removal supports the following four modes, and you can customize the protection area or specify the deletion area:

> a. Automatic text removal

> b. First mark the specified area, and then automatically remove the text in the specified area

> c. First mark the area, and then remove all the contents of the marked area

> d. After removing the text, adjust the specified area later

* 3.Video translation can be used together with multiple editing capabilities: One-click completion: video deduplication + automatic text removal + video translation + video music matching and other operations (including translated dubbing)
* 4.[API documents](https://jollytoday.feishu.cn/docx/T971dwGEko0Q6PxN24DcWQOKnQf "GhostCut API documents")

## 8. Contact Us
* WeChat: 360254, please indicate GitHub in the remark.
* Email：niumoz#izhaoli.com（#-->@）

