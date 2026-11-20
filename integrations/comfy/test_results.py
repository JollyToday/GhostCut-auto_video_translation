import json
import unittest
from unittest.mock import patch

import nodes


class ResultNodes(unittest.TestCase):
    def lookup(self, kind, payload):
        with patch.object(nodes, "_call", return_value=payload) as send:
            result = nodes.GetJob().run(kind, "12345")
        self.assertEqual(send.call_count, 1)
        self.assertEqual(send.call_args.args[0], nodes.CONTRACT[f"{kind}-status"]["path"])
        return result

    def test_unfinished_and_failed_jobs_do_not_publish_stale_links(self):
        for kind in ("image", "video"):
            for code in [-1, 0, 2, 83, None, True]:
                with self.subTest(kind=kind, code=code):
                    url = "https://example.org/old-output"
                    payload = ({"status": code, "result": "not complete"} if kind == "image" else
                               {"content": [{"id": 12345, "processStatus": code, "videoUrl": url, "srcSrtUrl": url}]})
                    result = self.lookup(kind, payload)
                    self.assertEqual(result["result"][1:], ("", ""))
                    self.assertNotIn(url, result["ui"]["text"])
                    if kind == "video" and code == 83:
                        self.assertIn("balance", result["ui"]["text"][0])

    def test_completed_image_can_be_missing_or_serialized(self):
        url = "https://example.org/result.jpg"
        for payload in (None, [], "{", {"output_url": "file:///private/data"}):
            row = self.lookup("image", {"status": 1, "result": payload})
            self.assertEqual(row["result"], ("1", "", ""))
            self.assertIn("without a download", row["ui"]["text"][0])
        for body in ({"output_url": url}, json.dumps({"output_url": url})):
            self.assertEqual(self.lookup("image", {"status": 1, "result": body})["result"], ("1", url, ""))

    def test_video_uses_only_its_own_row_and_valid_subtitle_link(self):
        link = "https://example.org/translation.srt"
        payload = {"content": [{"id": 1, "processStatus": 1, "videoUrl": "https://example.org/other"},
                               {"id": 12345, "processStatus": 1, "srcSrtUrl": "n/a", "tgtSrtUrl": link}]}
        self.assertEqual(self.lookup("video", payload)["result"], ("1", "", link))
        payload["content"].pop()
        with self.assertRaisesRegex(ValueError, "No matching"):
            self.lookup("video", payload)
