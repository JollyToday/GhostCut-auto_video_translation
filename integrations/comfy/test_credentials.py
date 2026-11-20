import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import nodes


class CredentialFiles(unittest.TestCase):
    def test_reads_the_first_valid_local_file(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            config = home / ".config" / "weydub"
            config.mkdir(parents=True)
            (config / "credentials.json").write_text(
                json.dumps({"app_key": " key ", "app_secret": " secret "}),
                encoding="utf-8",
            )
            with patch.object(nodes.Path, "home", return_value=home):
                self.assertEqual(nodes._credentials(), ("key", "secret"))

    def test_missing_credentials_explain_the_supported_locations(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(nodes.Path, "home", return_value=Path(directory)):
                with self.assertRaisesRegex(ValueError, "credentials\\.json"):
                    nodes._credentials()
