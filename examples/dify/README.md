# Use Weydub in Dify

Download [`subtitle-removal-0.1.0.difypkg`](subtitle-removal-0.1.0.difypkg). In a Dify workspace that permits local packages, open **Plugins → Install Plugin → Local Package** and select the download. This is a direct installation package; it does not carry a Dify Marketplace signature. Workspaces that require a verified signature may not install it.

Connect your Weydub account in the plugin settings using the [plugin guide](../../integrations/dify/README.md). Connecting checks credentials without starting a job. Keep your key and secret out of the workflow inputs.

In **Studio**, choose **Import DSL File** for each of these two files. They work independently and do not require an LLM.

| Workflow | What to enter | What you get |
|---|---|---|
| [Remove burned-in subtitles](submit-removal.yml) | A direct HTTPS link to a video you have permission to edit. Run once. | A `work_id`. Save it. Full-frame Pro uses Weydub credits and may also erase signs, prices or logos. |
| [Check a subtitle removal](check-removal.yml) | The saved `work_id`, using the same connected account. | `state` and `result`. When ready, `result` includes the private MP4 download link. |

If the status is `processing`, come back in about five minutes and run **Check a subtitle removal** again with the same ID. If the first workflow times out before showing an ID, check your Weydub job history before submitting again. For a clip where signs or product labels must stay, use [the Weydub subtitle removal editor](https://weydub.com/subtitle-removal/) to select the caption area.
