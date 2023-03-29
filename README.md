## [中文](https://github.com/JollyToday/GhostCut/blob/main/README.md "鬼手剪辑中文介绍")     ---- [English](https://github.com/JollyToday/GhostCut/blob/main/README_en.md "GhostCut English info") 

### 最新产品更新
* 03.23-#鬼手剪辑语音更新：接入剪映（抖音）、CapCut的常用声音，如东北老铁，广西壮汉，英文活力Ariana，欢迎体验;
* 03.15-#鬼手剪辑API更新：开放了去重、去文字、视频文字翻译、视频语音翻译等多项独家产品的API，欢迎咨询;
* 03.09-#鬼手剪辑翻译产品更新：所有翻译引擎调用ChatGPT，准确度更高，尤其是小语种之间的翻译效果，欢迎体验；
* 01.16-#鬼手剪辑翻译产品更新：翻译视频文字产品上线。

## 1.鬼手剪辑GhostCut-AI视频剪辑工具
鬼手剪辑是一款智能的视频剪辑软件，他的核心用途是帮助客户提高素材的处理速度和视频创意的生产的质量，我们用了大量的AI的能力在各个音视频的处理细节上，提高了对于很多视频的处理效率。
1. **【自动去文字】** 自动OCR检测视频中的所有文字并进行inpainting涂抹，尽量还原被擦除的视频部分；
2. **【自动翻译视频文字】** 自动OCR检测视频中的字幕，并对视频内文字的位置、样式、大小等进行计算和提取，然后使用ChatGPT对字幕翻译后按原文字样式、原位置贴回，同时对原文字进行inpainting涂抹；
3. **【自动翻译视频语音】** 自动ASR提取视频中的语音，并对提取后的语音进行翻译，同时使用TTS对翻译后的文本合成语音。在此过程计算原画面、语音和字幕的位置，会对新合成的语音、字幕和原画面做自动对齐，尽量保证音画一致。可以同时选择是否对原文字进行inpainting涂抹；可以选择是否保留原声，保留原声的效果是自动分离原视频的人声和背景音乐，保留背景音乐。
5. **【自动视频去重】** 自动对视频进行微小的改动处理，全自动完成以下操作，包括但不限于对修改md5、去除视频指纹、对视频叠加画中画、微小裁剪、使用高斯模糊、自动剪辑封面剪辑、画面做微弱倾斜、使用锐化、使用加减速等以及其他转场、滤镜、缩放等操作。一般用于视频快速二次创作或视频裂变处理。

## 2.产品特色
1. 使用了大量最新的AI技术+音视频处理算法，尽可能提高处理效果；
2. 采用自动化和智能化的设计理念，端到端的解决问题，尽可能交付成品；
3. 开放了所有的API和中间产物，方便大家集成。

## 3.视频处理案例
[鬼手剪辑测试地址](https://ghostcut.jollytoday.com/index/cn?redirect=%2Fhome/cn&code=th741 "GhostCut体验")。
有中英文版本。大陆用户可以访问微信小程序，鬼手剪辑。

### 智能去文字-案例
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595877.jpg" width="720">
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595884.jpg" width="720">

自动OCR检测文字并去除, 视频效果请点此查看
[YouTube去文字视频案例](https://youtu.be/uFBkMXQokMk "鬼手剪辑视频自动去文字案例")


**鬼手剪辑能自动去除哪些案例？具体如下**
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595885.png" width="720">

### 自动翻译视频文字-案例
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595888.jpg" width="720">
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595887.jpg" width="720">

翻译后的视频文字样式保持不变, 视频效果请点此查看
[YouTube视频文字翻译案例](https://youtu.be/VDXR6y7-pBg "鬼手剪辑视频文字翻译案例")


### 自动翻译视频语音-案例
<img src="https://gc100.cdn.izhaoli.cn/ve_material_image/a0b03034fcbd457c/1679900595889.jpg" width="720">

翻译后的视频是带有语音同步解说的, 视频效果请点此查看
[YouTube视频语音翻译案例](https://youtu.be/3w7GJjg5C0Q?t=80 "鬼手剪辑视频语音翻译案例")


## 4.具体AI剪辑能力说明
### 视频微剪辑/视频去重相关
* 支持基础视频去重，一次性做基础微剪裁
* 支持叠加视频特效
1 扫光
2 泛光开幕
3 下降开幕
4 书单模式
5 溶图模式
6 横版视频三屏显示
7 好物
8 影视
* 支持叠加随机转场、随机缩放、随机边框、镜像反转
* 支持算法自动配乐，通过计算原视频的节奏并自动匹配类似节奏的音乐
* 支持匹配指定音乐

### 去文字和视频擦除inpainting相关
* 支持自动去文字、先标记区域仅自动去文字、标记区域后全部去除、去文字后调整保护或擦除区域重新合成
* 支持去除移动文字/移动文字水印
* 支持自动检测视频主体和上下边缘，对视频主体之外的背景重新填充

### 视频语音翻译相关
* 支持ASR提取视频语音并翻译
* ASR提取视频声音时人声和背景声分离，仅翻译人声
* 支持翻译后视频静音、保留背景声音、算法配乐或指定音乐匹配
* 支持仅生成翻译字幕（不带TTS合成）
* 支持翻译字幕并带TTS语音合成（合成时自动计算字幕、画面和声音的位置进行匹配）

### 视频文字翻译相关
* 支持OCR提取视频文字并翻译
* OCR提取视频文字时，支持文字位置、样式提取
* 即将支持对翻译后的文字TTS合成

## 5.技术细节
语音：ASR和TTS综合使用自研+讯飞、阿里云、Google、微软和火山引擎等；
翻译：综合使用讯飞、deepl、chatgpt翻译等；

## 6.翻译支持语言
智能去文字：同时去除中英文，单独去除中文、英文、日语、韩语、阿拉伯语；
视频文字翻译：源语言：中文或者英文；目标语言：中文/英语/日语/印尼语/葡萄牙语/法语/西班牙语/印地语/阿拉伯语/越南语/泰语/德语/俄语/土耳其语/意大利语/菲律宾/马来西亚/高棉语
视频语音翻译：源语言：中文/英语/日语/韩语/西班牙语/意大利语/俄语/法语/葡萄牙语/越南语/泰语/等，目标语言：中文/英语/日语/印尼语/葡萄牙语/法语/西班牙语/印地语/阿拉伯语/越南语/泰语/德语/俄语/土耳其语/意大利语/越南语

## 7.API接口支持
* 1.提供了上述所有能力的输出，包括视频去重剪辑、自动去文字、视频擦除、视频字幕翻译、视频语音翻译（含配音）等接口，多个能力可以叠加一起选择；
* 2.去文字支持以下abcd4种模式，可自定义保护区域或者指定删除区域：

> a.自动去文字

> b.先标记指定区域，然后再指定区域内自动去文字

> c.先标记区域，然后把标记区域的内容**全部去除** 

> d.去文字后，后续再对指定区域调整 

* 3.视频翻译可与多个剪辑能力一起叠加使用：
一键完成：视频去重+视频去文字+视频翻译+视频配乐等操作（含翻译后的配音）
* 4.API接口文档，请访问以下
[飞书接口文档](https://jollytoday.feishu.cn/docx/T971dwGEko0Q6PxN24DcWQOKnQf "鬼手剪辑接口文档")

## 8.联系我们
微信：360254 ，请备注github
