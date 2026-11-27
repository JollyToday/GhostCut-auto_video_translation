"""Run the response handlers embedded in the Dify import, without network or keys."""
import json
import unittest
from pathlib import Path

import yaml


def handler(node_id):
    graph = yaml.safe_load(Path(__file__).with_name("sponsored-removal.yml").read_text())["workflow"]["graph"]
    node = next(item["data"] for item in graph["nodes"] if item["id"] == node_id)
    namespace = {}
    exec(node["code"], namespace)
    return namespace["main"]


class SponsoredResponses(unittest.TestCase):
    def test_only_confirmed_results_offer_downloads(self):
        check = handler("520")
        link = "https://gc70.cdn.izhaoli.cn/example.mp4?expires=42"
        ready = json.dumps({"state": "ready", "videoUrl": link})
        self.assertEqual(check(ready, 200)["download_url"], link)
        for code, body in [(503, ready), (404, "<html>Not found</html>"), (200, "null"),
                           (200, json.dumps({"state": "expired", "videoUrl": link})),
                           (200, json.dumps({"state": "ready", "videoUrl": "https://example.org/file.mp4"}))]:
            with self.subTest(code=code, body=body):
                self.assertEqual(check(body, code)["download_url"], "")
        self.assertIn("No job found", check('{"error":"Unknown receipt."}', 404)["message"])
        self.assertNotIn("No job found", check("<html>Not found</html>", 404)["message"])

    def test_refusals_do_not_instruct_the_user_to_submit_again_or_switch_to_paid(self):
        upload = handler("500")
        for code, clue in [(413, "16 MiB"), (422, "H.264"), (429, "No paid job")]:
            answer = upload("<html>Unavailable</html>", code)
            self.assertEqual(answer["state"], "not_confirmed")
            self.assertIn(clue, answer["message"])
        self.assertEqual(upload('{"state":"unknown"}', 200)["state"], "not_confirmed")
        self.assertIn("already has a job", upload('{"state":"ready","replayed":true}', 200)["message"])


if __name__ == "__main__":
    unittest.main()
