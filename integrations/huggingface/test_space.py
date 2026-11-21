"""Run against the staged upload with PYTHONPATH pointing to that directory."""
from types import SimpleNamespace
import os
from pathlib import Path
import sys

import gradio as gr
import pytest

# The repository keeps the shared client in the Comfy integration and copies
# it into a staged Space package at release time.
PACKAGE_DIR = os.environ.get("WEYDUB_HF_PACKAGE")
sys.path.insert(0, PACKAGE_DIR or str(Path(__file__).resolve().parents[1] / "comfy"))

import app
import nodes


@pytest.fixture
def personal_space(monkeypatch):
    for key, value in {
        "SPACE_ID": "customer/my-copy", "SPACE_HOST": "example.hf.space",
        "SYSTEM": "spaces", "WEYDUB_ENABLE_LIVE": "1", "OAUTH_SCOPES": "openid profile",
        "OPENID_PROVIDER_URL": "https://huggingface.co", "OAUTH_CLIENT_ID": "test-only",
        "OAUTH_CLIENT_SECRET": "test-only", "WEYDUB_APP_KEY": "test-only",
        "WEYDUB_APP_SECRET": "test-only",
    }.items():
        monkeypatch.setenv(key, value)
    return SimpleNamespace(username="customer")


def test_preview_is_offline(monkeypatch):
    monkeypatch.setattr(nodes, "_call", lambda *_: pytest.fail("A preview submitted a task"))
    for name in app.OPS:
        payload = app.preview(name, "https://example.org/my-media", "zh", "en")
        assert payload["method"] == "POST"
        assert "https://example.org/my-media" in str(payload["body"])


def test_live_requires_native_oauth_and_owner(personal_space, monkeypatch):
    monkeypatch.setattr(app, "space_request", lambda *_: pytest.fail("Unauthorized call"))
    with pytest.raises(gr.Error):
        app.lookup("video", "123", None)
    with pytest.raises(gr.Error):
        app.lookup("video", "123", SimpleNamespace(username="another-user"))
    with pytest.raises(gr.Error):
        app.submit("Dub video", "https://example.org/a", "zh", "en", False, personal_space)
    monkeypatch.setenv("SYSTEM", "local")
    assert not app.live_configured()
    monkeypatch.setenv("SYSTEM", "spaces")
    monkeypatch.setenv("SPACE_ID", "Weydub/media-localization")
    assert not app.live_configured()


def test_live_submission_and_resolution(personal_space, monkeypatch):
    requests = []

    def upstream(path, body):
        requests.append((path, body))
        if path.endswith("/translate/query"):
            return {"status": 1, "result": '{"output_url":"https://example.org/done.jpg"}'}
        if path.endswith("/image/translate"):
            return 124
        if path.endswith("/work/status"):
            return {"content": [{"id": 999, "processStatus": 1}, {"id": 123, "processStatus": 1, "srcSrtUrl": "https://example.org/done.srt"}]}
        return {"dataList": [{"id": 123}]}

    monkeypatch.setattr(app, "space_request", upstream)
    for name in app.OPS:
        kind, job, _, files, links = app.submit(name, "https://example.org/a", "zh", "en", True, personal_space)
        assert job == ("124" if kind == "image" else "123")
        assert files == {}
        assert links == ""
        _, files, links = app.lookup(kind, job, personal_space)
        assert files == ({"image": "https://example.org/done.jpg"} if kind == "image" else {"subtitles": "https://example.org/done.srt"})
        assert links
    assert len(requests) == 8


def test_space_secrets_are_the_only_live_credentials(monkeypatch):
    monkeypatch.setenv("WEYDUB_APP_KEY", "space-key")
    monkeypatch.setenv("WEYDUB_APP_SECRET", "space-secret")
    monkeypatch.setattr(app, "signed_request", lambda path, body, key, secret:
                        (path, body, key, secret))
    assert app.space_request("/path", {"ok": True}) == ("/path", {"ok": True}, "space-key", "space-secret")


def test_space_request_never_falls_back_to_local_credential_files(monkeypatch):
    monkeypatch.delenv("WEYDUB_APP_KEY", raising=False)
    monkeypatch.delenv("WEYDUB_APP_SECRET", raising=False)
    monkeypatch.setattr(nodes, "_credentials", lambda: pytest.fail("local credentials were read"))
    with pytest.raises(ValueError, match="Space Secrets"):
        app.space_request("/path", {"ok": True})


def test_space_preview_uses_full_frame_pro_and_keeps_comfy_lite():
    payload = app.preview("Remove subtitles", "https://example.org/video.mp4", "zh", "en")
    assert payload["body"]["needChineseOcclude"] == 1
    assert payload["body"]["videoInpaintLang"] == "all"
    assert "videoInpaintMasks" not in payload["body"]
    assert "advanced_full" in payload["body"]["extraOptions"]
    lite = nodes.Erase().run("https://example.org/video.mp4")["result"][1]
    assert "advanced_lite" in lite
    assert "videoInpaintMasks" in lite
