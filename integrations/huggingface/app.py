import json
import os
import re
from html import escape
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import gradio as gr

from gallery import GALLERY, IMAGE, gallery
from nodes import CONTRACT, Dub, Erase, GetJob, Image, OCR, signed_request

HERE = Path(__file__).parent
OPS = {"Remove subtitles": Erase, "Extract subtitles": OCR, "Dub video": Dub, "Translate image": Image}
DEFAULT = "Remove subtitles"
SPACE_CONTRACT = {**CONTRACT, "erase": {"path": CONTRACT["erase"]["path"], "body": {
    "needChineseOcclude": 1, "videoInpaintLang": "all",
    "extraOptions": json.dumps({"extra_inpaint_config": {"model": "advanced_full"}}, separators=(",", ":"))
}}}


def space_request(path, body):
    key, secret = (os.getenv(name, "").strip() for name in ("WEYDUB_APP_KEY", "WEYDUB_APP_SECRET"))
    if not key or not secret:
        raise ValueError("Add both Weydub credentials to your Space Secrets and restart the Space.")
    return signed_request(path, body, key, secret)


def live_configured() -> bool:
    sid = os.environ.get("SPACE_ID", "").lower()
    return bool(os.environ.get("WEYDUB_ENABLE_LIVE") == "1" and os.environ.get("SYSTEM") == "spaces" and sid.count("/") == 1
                and sid.split("/")[0] != "weydub" and os.environ.get("SPACE_HOST")
                and all(os.environ.get(k) for k in ("OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET", "OAUTH_SCOPES", "OPENID_PROVIDER_URL",
                                                      "WEYDUB_APP_KEY", "WEYDUB_APP_SECRET")))


def require_owner(profile: gr.OAuthProfile | None) -> None:
    owner = os.environ.get("SPACE_ID", "").split("/")[0].lower()
    if not live_configured() or not profile or profile.username.lower() != owner:
        raise gr.Error("Live processing requires signing in as the owner of your configured personal duplicate.")


def arguments(name: str, url: str, source: str, target: str) -> dict:
    if name not in OPS:
        raise gr.Error("Choose an operation.")
    args = {"media_url": url.strip()}
    if name != "Remove subtitles":
        args["source_language"] = source.strip()
    if name in ("Dub video", "Translate image"):
        args["target_language"] = target.strip()
    return args


def preview(name: str, url: str, source: str, target: str) -> dict:
    args = arguments(name, url, source, target)
    try:
        op = OPS[name](request=space_request, contract=SPACE_CONTRACT)
        _, text = op.run(**args)["result"]
        return {"method": "POST", "endpoint": "https://api.zhaoli.com" + CONTRACT[op.op]["path"],
                "body": json.loads(text.removeprefix("Preview: "))}
    except ValueError as exc:
        raise gr.Error(str(exc)) from None


def submit(name: str, url: str, source: str, target: str, consent: bool,
           profile: gr.OAuthProfile | None) -> tuple[str, str, str, dict, str]:
    require_owner(profile)
    if consent is not True:
        raise gr.Error("Confirm that this file may be processed using your own credits.")
    try:
        job, _ = OPS[name](request=space_request, contract=SPACE_CONTRACT).run(**arguments(name, url, source, target), submit_billable_job=True)["result"]
        return ("image" if name == "Translate image" else "video", job, f"Accepted job {job}. Use Get result to check its progress.", {}, "")
    except (KeyError, ValueError, RuntimeError) as exc:
        raise gr.Error(str(exc)) from None


def lookup(kind: str, job: str, profile: gr.OAuthProfile | None) -> tuple[str, dict, str]:
    require_owner(profile)
    if not job.strip():
        return "Enter the job ID from your submission.", {}, ""
    try:
        result = GetJob(request=space_request).run(kind, job.strip())
        status, media, srt = result["result"]
    except (ValueError, RuntimeError) as exc:
        return str(exc), {}, ""
    files = {}
    if status == "1":
        for label, raw in [("image" if kind == "image" else "video", media), ("subtitles", srt)]:
            if raw and not any(ord(c) < 32 or c in '\\<>"' for c in raw):
                url = urlsplit(raw)
                if url.scheme in ("https", "http") and url.hostname and url.username is None:
                    files[label] = urlunsplit(url._replace(scheme="https"))
    hint = result["ui"]["text"][0]
    if status == "1" and not files:
        hint = "Finished without a usable download link. Contact Weydub with this job ID."
    elif status.lstrip("-").isdigit() and int(status) <= 0:
        hint = "Still processing. Use Get result again with the same ID."
    return f"Job {job.strip()} (status {status}): {hint}", files, download_links(files)


def choose(name: str, media_url: str) -> tuple:
    url_change = gr.update()
    if name != "Translate image" and media_url == IMAGE:
        url_change = gr.update(value="")
    elif name == "Translate image" and not media_url.strip() and not live_configured():
        url_change = gr.update(value=IMAGE)
    return (gallery(name), gr.update(visible=name != "Remove subtitles",
            label="Spoken language" if name == "Dub video" else "Visible text language"),
            gr.update(visible=name in ("Translate image", "Dub video")),
            gr.update(visible=name == "Extract subtitles"), None, False, url_change)


def build() -> gr.Blocks:
    active = live_configured()
    with gr.Blocks(title="Weydub Media Localization Lab", analytics_enabled=False) as lab:
        gr.Markdown("# Weydub Media Localization Lab\nCompare media samples and build a request for your own file.")
        operation = gr.Radio(list(GALLERY), value=DEFAULT, label="Operation")
        scene = gr.HTML(gallery(DEFAULT))
        fixture = gr.DownloadButton("Download sample SRT", value=str(HERE / "example.srt"), visible=False)
        gr.Markdown("## Build a request")
        url = gr.Textbox(label="Direct link to your media", placeholder="https://…", max_lines=1)
        with gr.Row():
            source = gr.Textbox(label="Visible text language", value="zh", visible=False)
            target = gr.Textbox(label="Target language", value="en", visible=False)
        inputs = [operation, url, source, target]
        show = gr.Button("Preview request", variant="primary")
        payload = gr.JSON(label="Request body", open=True)
        if active:
            gr.LoginButton()
        with gr.Group(visible=active):
            consent = gr.Checkbox(label="Use my Weydub credits for this authorized file.")
            send = gr.Button("Submit one file")
            with gr.Row():
                kind = gr.Radio(["video", "image"], label="Result type", value="video")
                job = gr.Textbox(label="Job ID")
            get = gr.Button("Get result")
            message = gr.Textbox(label="Job status", interactive=False)
            downloads = gr.HTML()
            files = gr.JSON(label="Download URLs", open=False)
        links = "[API documentation](https://weydub.com/docs/api/) · [Processing prices](https://weydub.com/vip/pricing-detail/)"
        if not active:
            sid = os.environ.get("SPACE_ID", "")
            clone = (f"[Create a private copy](https://huggingface.co/spaces/{sid}?duplicate=true)"
                     if re.fullmatch(r"[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+", sid) else "Create a private copy of this Space")
            links = f"{clone} to process files with your own Weydub credits, or [open the Weydub editor](https://weydub.com/subtitle-removal/).\n\n{links}"
        gr.Markdown(links)
        operation.change(choose, [operation, url], [scene, source, target, fixture, payload, consent, url], api_visibility="private")
        show.click(preview, inputs, payload, api_name="preview")
        if active:
            send.click(submit, [*inputs, consent], [kind, job, message, files, downloads], api_name="submit")
            get.click(lookup, [kind, job], [message, files, downloads], api_name="result")
            for control in (kind, job):
                control.input(lambda: ("", {}, ""), None, [message, files, downloads], api_visibility="private")
    return lab


def download_links(files):
    labels = {"video": "Download video (MP4)", "image": "Download translated image", "subtitles": "Download subtitles (SRT)"}
    return " · ".join(f'<a href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">{label}</a>'
                      for key, label in labels.items() if isinstance(files, dict)
                      and isinstance(url := files.get(key), str) and url.startswith("https://"))


if __name__ == "__main__":
    build().launch(css=(HERE / "theme.css").read_text(), show_error=False,
                   theme=gr.themes.Base(primary_hue="indigo"), footer_links=[])
