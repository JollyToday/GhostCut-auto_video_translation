import hashlib
import json
import re
from copy import deepcopy
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

CONTRACT = json.loads(Path(__file__).with_name("contract.json").read_text())
NODE_DIR = Path(__file__).resolve().parent


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


def _credential_paths():
    return (
        Path.home() / ".config" / "weydub" / "credentials.json",
        Path.home() / ".weydub" / "credentials.json",
        NODE_DIR / "credentials.json",
    )


def _credentials():
    for path in _credential_paths():
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (FileNotFoundError, OSError, ValueError):
            continue
        if isinstance(payload, dict):
            key = payload.get("app_key")
            secret = payload.get("app_secret")
            if isinstance(key, str) and key.strip() and isinstance(secret, str) and secret.strip():
                return key.strip(), secret.strip()
    locations = ", ".join(str(path) for path in _credential_paths())
    raise ValueError(
        "Add app_key and app_secret to one of these local Weydub credential files: " + locations
    )


def _call(path, body):
    key, secret = _credentials()
    wire = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode()
    first = hashlib.md5(wire).hexdigest()
    signature = hashlib.md5((first + secret).encode()).hexdigest()
    request = Request(
        "https://api.zhaoli.com" + path, data=wire, method="POST",
        headers={"Content-Type": "application/json", "AppKey": key, "AppSign": signature},
    )
    try:
        with build_opener(NoRedirect).open(request, timeout=45) as response:
            result = json.load(response)
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError("No confirmed response. Check existing jobs before resubmitting.") from None
    if result.get("code") != 1000:
        raise ValueError(f"Weydub returned code {result.get('code')}. Check your job list and credits.")
    return result["body"]


def _result(*values):
    return {"ui": {"text": [str(x) for x in values if x]}, "result": values}


def _download(value):
    if not isinstance(value, str) or any(c.isspace() for c in value):
        return ""
    try:
        u = urlsplit(value)
        if u.scheme in ("http", "https") and u.hostname and u.username is None and u.password is None:
            return value
    except ValueError:
        pass
    return ""


def _job_result(code, media="", subtitles="", kind="video"):
    # Keep the original numeric status and socket order for existing graphs.
    if type(code) is not int:
        state, hint = "unknown", "Unrecognized status. Check the original job in Weydub."
    elif code < 1:
        state, hint = str(code), "Processing. Queue Get Job Result again with the same ID."
    elif code != 1:
        state = str(code)
        hint = ("Check your Weydub balance to unlock the original job." if kind == "video" and code == 83
                else "Processing failed. Check the original job in Weydub before resubmitting.")
    else:
        state, media, subtitles = "1", _download(media), _download(subtitles)
        hint = ("Ready. Open the result link to download your file." if media or subtitles
                else "Finished without a download link. Contact Weydub with the original job ID.")
    if state != "1":
        media = subtitles = ""
    return {"ui": {"text": [s for s in (hint, media, subtitles) if s]}, "result": (state, media, subtitles)}


class CreateJob:
    CATEGORY = "Weydub/Media"
    FUNCTION = "run"
    OUTPUT_NODE = True
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("job_id", "request_or_status")

    @classmethod
    def INPUT_TYPES(cls):
        args = {"media_url": ("STRING", {"default": "", "tooltip": "Direct HTTPS link to your media."})}
        if cls.op in ("ocr", "dub", "image"):
            args["source_language"] = ("STRING", {"default": "zh"})
        if cls.op in ("dub", "image"):
            args["target_language"] = ("STRING", {"default": "en"})
        args["submit_billable_job"] = ("BOOLEAN", {"default": False})
        return {"required": args}

    def run(self, media_url, submit_billable_job=False, source_language="zh", target_language="en"):
        url = urlsplit(media_url)
        if url.scheme != "https" or not url.hostname or url.username or url.password:
            raise ValueError("Use a directly downloadable HTTPS media URL without login credentials.")
        for lang in (source_language, target_language):
            if not re.fullmatch(r"[a-z]{2,3}(?:-[A-Za-z]{2,4})?", lang):
                raise ValueError("Use a language code, for example zh or en.")
        entry = CONTRACT[self.op]
        body = deepcopy(entry["body"])
        if self.op == "image":
            body.update(downloadInfo=json.dumps({"url": media_url}), srcLang=source_language, tgtLang=target_language)
        else:
            body["urls"] = [media_url]
        if self.op == "ocr":
            body.update(lang=source_language, videoInpaintLang=source_language)
        if self.op == "dub":
            body.update(sourceLang=source_language, lang=target_language)
        if not submit_billable_job:
            return _result("", "Preview: " + json.dumps(body, ensure_ascii=False))
        reply = _call(entry["path"], body)
        job_id = reply if self.op == "image" else next(iter(reply.get("dataList", [])), {}).get("id")
        if not job_id:
            raise RuntimeError("No job ID returned. Check existing jobs before resubmitting.")
        return _result(str(job_id), "Accepted. Use Get Job Result with this ID.")


class Erase(CreateJob):
    op = "erase"
    DESCRIPTION = "Remove burned-in subtitles in the bottom 18% of a video with Lite inpainting."


class OCR(CreateJob):
    op = "ocr"
    DESCRIPTION = "Read text in the whole frame. Choose the language you see. The finished file is a timed SRT."


class Dub(CreateJob):
    op = "dub"
    DESCRIPTION = "Translate speech with high-emotion dubbing. Use a voice you may process. Existing burned-in text remains."


class Image(CreateJob):
    op = "image"
    DESCRIPTION = "Translate the text in an image and return an image with the translation in place."


class GetJob:
    CATEGORY = "Weydub/Media"
    FUNCTION = "run"
    OUTPUT_NODE = True
    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("status", "output_url", "srt_url")

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"kind": (["video", "image"],), "job_id": ("STRING", {"default": ""})}}

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("nan")  # Each queue action should refresh the existing job.

    def run(self, kind, job_id):
        if not job_id:  # A linked preview has no remote job to look up.
            return _result("No job submitted", "", "")
        if not re.fullmatch(r"[1-9][0-9]*", job_id) or kind not in ("image", "video"):
            raise ValueError("Choose the media type and use the job ID returned by creation.")
        if kind == "image":
            b = _call(CONTRACT["image-status"]["path"], {"id": int(job_id)})
            code = b.get("status")
            if type(code) is not int or code != 1:
                return _job_result(code, kind=kind)
            result = b.get("result")
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except ValueError:
                    result = None
            return _job_result(code, result.get("output_url") if isinstance(result, dict) else None, kind=kind)
        b = _call(CONTRACT["video-status"]["path"], {"idWorks": [job_id]})
        row = next((x for x in b.get("content", []) if str(x.get("id")) == job_id), None)
        if not row:
            raise ValueError("No matching video job for this account.")
        return _job_result(row.get("processStatus"), row.get("videoUrl"),
                           _download(row.get("srcSrtUrl")) or row.get("tgtSrtUrl"))


NODE_CLASS_MAPPINGS = {"WeydubLiteErase": Erase, "WeydubFullFrameOCR": OCR, "WeydubDub": Dub,
                       "WeydubImageTranslation": Image, "WeydubGetJob": GetJob}
NODE_DISPLAY_NAME_MAPPINGS = {"WeydubLiteErase": "Weydub: Remove Subtitles (Lite)",
                              "WeydubFullFrameOCR": "Weydub: Extract Subtitles (Full-Frame OCR)",
                              "WeydubDub": "Weydub: Dub Speech", "WeydubImageTranslation": "Weydub: Translate Image",
                              "WeydubGetJob": "Weydub: Get Job Result"}
