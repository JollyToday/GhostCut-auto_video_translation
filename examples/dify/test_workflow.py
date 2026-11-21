from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "integrations/dify"))
from tools.result import RemovalResult
from tools.submit import SubmitRemoval
import weydub_api


def outputs(tool, **params):
    return {m.message.variable_name: m.message.variable_value for m in
            tool.from_credentials({"app_key": "demo", "app_secret": "demo"}).invoke(params)
            if m.type.value == "variable"}


def test_timeout_does_not_retry_submission(monkeypatch):
    paths = []

    def fail(credentials, path, payload):
        paths.append(path)
        raise weydub_api.ApiError("Timed out.")

    monkeypatch.setattr(weydub_api, "call", fail)
    with pytest.raises(weydub_api.ApiError, match="history"):
        outputs(SubmitRemoval, video_url="https://example.org/clip.mp4")
    assert paths == ["work/free"]


def test_polls_only_same_work_and_withholds_unrelated_url(monkeypatch):
    paths = []
    rows = [{"id": 99, "processStatus": 1, "videoUrl": "https://example.org/other.mp4"}]

    def call(credentials, path, payload):
        paths.append(path)
        assert payload == {"idWorks": ["42"]}
        return {"content": rows}

    monkeypatch.setattr(weydub_api, "call", call)
    with pytest.raises(weydub_api.ApiError, match="matching"):
        outputs(RemovalResult, work_id="42")
    rows.append({"id": 42, "processStatus": -1})
    assert outputs(RemovalResult, work_id="42") == {"state": "processing"}
    rows[-1]["processStatus"] = 2
    assert outputs(RemovalResult, work_id="42") == {"state": "failed"}
    assert paths == ["work/status"] * 3
