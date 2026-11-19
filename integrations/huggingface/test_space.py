"""Run against the staged upload with PYTHONPATH pointing to that directory."""
from types import SimpleNamespace

import gradio as gr
import pytest
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
    monkeypatch.setattr(nodes, "_call", lambda *_: pytest.fail("Unauthorized call"))
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

    monkeypatch.setattr(nodes, "_call", upstream)
    for name in app.OPS:
        kind, job, _ = app.submit(name, "https://example.org/a", "zh", "en", True, personal_space)
        assert job == ("124" if kind == "image" else "123")
        _, files = app.lookup(kind, job, personal_space)
        assert files == ({"image": "https://example.org/done.jpg"} if kind == "image" else {"subtitles": "https://example.org/done.srt"})
    assert len(requests) == 8
