import json
import os
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import gradio as gr

from gallery import GALLERY, gallery
from nodes import CONTRACT, Dub, Erase, GetJob, Image, OCR

HERE = Path(__file__).parent
OPS = {"Remove subtitles": Erase, "Extract subtitles": OCR, "Dub video": Dub, "Translate image": Image}
DEFAULT = "Remove subtitles"


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
        op = OPS[name]()
        _, text = op.run(**args)["result"]
        return {"method": "POST", "endpoint": "https://api.zhaoli.com" + CONTRACT[op.op]["path"],
                "body": json.loads(text.removeprefix("Preview: "))}
    except ValueError as exc:
        raise gr.Error(str(exc)) from None


def submit(name: str, url: str, source: str, target: str, consent: bool,
           profile: gr.OAuthProfile | None) -> tuple[str, str, str]:
    require_owner(profile)
    if consent is not True:
        raise gr.Error("Confirm that this file may be processed using your own credits.")
    try:
        job, _ = OPS[name]().run(**arguments(name, url, source, target), submit_billable_job=True)["result"]
        return ("image" if name == "Translate image" else "video", job, f"Accepted job {job}. Use Get result to check its progress.")
    except (KeyError, ValueError, RuntimeError) as exc:
        raise gr.Error(str(exc)) from None


def lookup(kind: str, job: str, profile: gr.OAuthProfile | None) -> tuple[str, dict]:
    require_owner(profile)
    if not job.strip():
        raise gr.Error("Enter the job ID from your submission.")
    try:
        status, media, srt = GetJob().run(kind, job.strip())["result"]
    except (ValueError, RuntimeError) as exc:
        raise gr.Error(str(exc)) from None
    files = {}
    if status == "1":
        for label, raw in [("image" if kind == "image" else "video", media), ("subtitles", srt)]:
            url = urlsplit(raw or "")
            if url.scheme in ("https", "http") and url.hostname and not (url.username or url.password):
                files[label] = urlunsplit(url._replace(scheme="https"))
    return (f"Job {job}: " + ("complete." if status == "1" else f"status {status}. Check this ID again if still processing."), files)


def choose(name: str) -> tuple:
    return (gallery(name), gr.update(visible=name != "Remove subtitles",
            label="Spoken language" if name == "Dub video" else "Visible text language"),
            gr.update(visible=name in ("Translate image", "Dub video")),
            gr.update(visible=name == "Extract subtitles"), None, False)


def build() -> gr.Blocks:
    with gr.Blocks(title="Weydub Media Localization Lab", analytics_enabled=False) as lab:
        gr.Markdown("# Weydub Media Localization Lab\nCompare media samples and build a request for your own file.")
        operation = gr.Radio(list(GALLERY), value=DEFAULT, label="Operation")
        scene = gr.HTML(gallery(DEFAULT))
        fixture = gr.DownloadButton("Download sample SRT", value=str(HERE / "example.srt"), visible=False)
        gr.Markdown("## Build a request")
        url = gr.Textbox(label="Downloadable media URL", placeholder="https://…", max_lines=1)
        with gr.Row():
            source = gr.Textbox(label="Visible text language", value="zh", visible=False)
            target = gr.Textbox(label="Target language", value="en", visible=False)
        inputs = [operation, url, source, target]
        show = gr.Button("Preview request", variant="primary")
        payload = gr.JSON(label="Request body", open=True)
        active = live_configured()
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
            files = gr.JSON(label="Download URLs")
        gr.Markdown("[API documentation](https://weydub.com/docs/api/) · [Processing prices](https://weydub.com/vip/pricing-detail/)"
                    + ("" if active else "\n\nTo process your own files, use a private duplicate with your Weydub credentials. See the Space README."))
        operation.change(choose, operation, [scene, source, target, fixture, payload, consent])
        show.click(preview, inputs, payload, api_name="preview")
        if active:
            send.click(submit, [*inputs, consent], [kind, job, message], api_name="submit")
            get.click(lookup, [kind, job], [message, files], api_name="result")
    return lab


if __name__ == "__main__":
    build().launch(css=(HERE / "theme.css").read_text(), show_error=False,
                   theme=gr.themes.Base(primary_hue="indigo"), footer_links=[])
