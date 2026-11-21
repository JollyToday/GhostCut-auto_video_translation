"""Public product media. Nothing here is fetched with customer credentials."""

from base64 import b64encode
from html import escape
from pathlib import Path

ROOT = "https://weydub.com"
IMAGE = "https://gc100.cdn.izhaoli.cn/ve_material_image/A-00b4943646344cfc/e2d6dd82903f4059bd94c9b660f5f7b6/1782789120948.webp"
VIDEO = "https://p.cdn.izhaoli.cn/gc/web/static/20250526/video/AI-Video-Translator-ar-zh-to-en.mp4"
IMG_ROOT = ROOT + "/assets/weydub-public/subtitle-removal/text-removal-"


def label_pair():
    figures = []
    for lang, label in [("zh", "Chinese original"), ("en", "English translation")]:
        data = Path(__file__).with_name(f"label-{lang}.webp").read_bytes()
        src = "data:image/webp;base64," + b64encode(data).decode("ascii")
        figures.append(f'<figure><img alt="{label} of the 3D product poster" width="480" height="640" '
                       f'src="{src}"><figcaption>{label}</figcaption></figure>')
    return '<div class="pair labels">' + "".join(figures) + "</div>"


GALLERY = {
    "Remove subtitles": (
        "Burned-in subtitles", "The words are still visible when the player captions are off. Compare the same scene before and after removal.",
        '<div class="pair">' + "".join(
            f'<figure><img alt="{label}" width="270" height="480" src="{IMG_ROOT}{suffix}-poster-480.webp"><figcaption>{label}</figcaption></figure>'
            for label, suffix in [("Original frame", "original"), ("After removal", "after")]
        ) + "</div>",
        "Pro searches the whole frame. It can also remove prices and signs. Use the Weydub editor if you need to preserve text outside a caption band.", "/subtitle-removal/"),
    "Extract subtitles": (
        "A subtitle file from visible text", "Use the language in the picture, even when the narrator speaks a different language. Full-frame OCR can also pick up signs and labels.",
        '<div class="cues"><div><time>00:00.000 – 00:02.200</time><p>Choose the language you see on screen.</p></div>'
        '<div><time>00:02.300 – 00:05.000</time><p>Save the subtitle file beside your video.</p></div></div>',
        "Two example cues, written to illustrate the SRT format.", "/subtitle-generator/"),
    "Dub video": (
        "Listen to the translated dialogue", "Compare the delivery across the same cuts. Dubbing changes the voice track; it does not remove captions already in the picture.",
        f'<video controls playsinline preload="none" width="800" height="450" poster="{ROOT}/assets/weydub-public/core-landings/video-translator-poster.webp"><source src="{VIDEO}" type="video/mp4"></video>',
        "Published Weydub video translation demo. Use authorized speech for your own job.", "/video-translator/"),
    "Translate image": (
        "Text inside a product photo", "The translated title belongs in the picture itself. Review small print, units and logos before publishing.",
        label_pair(),
        "The English poster is an actual API output from the Chinese original shown here.", "/image-translator/"),
}


def gallery(name: str) -> str:
    title, lead, visual, note, path = GALLERY[name]
    return (f'<section class="media-view"><h2>{escape(title)}</h2><p>{escape(lead)}</p>'
            f'{visual}<p class="legend">{escape(note)} <a href="{ROOT}{path}" target="_blank" '
            'rel="noopener noreferrer">See product examples</a></p></section>')
