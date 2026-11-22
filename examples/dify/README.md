# Use Weydub in Dify

**Try your own short clip without an API key.** Import [the sponsored Pro workflow](sponsored-removal.yml) in **Studio → Import DSL File**. It needs no plugin, model or paid Weydub account. The workflow uses Dify's standard Code and HTTP Request nodes. Try the [15-second practice clip](../full-frame-removal/) or an H.264 MP4 you have permission to process, up to 60 seconds and 16 MiB (optional AAC audio).

1. Run **Create a private receipt**, leaving the other fields empty. Save the receipt. This step uses no processing slot.
2. Select **Submit my authorized clip to Weydub**, paste that receipt, choose your MP4 and run. Selecting the file stores it in your Dify workspace. Running this action sends it to Weydub. Full-frame Pro can also erase signs and prices.
3. Select **Check my result**, paste the same receipt and run without a file. When it says *Your MP4 is ready*, open `download_url`. Use the same receipt after timeouts; resending identical bytes with it does not start a second job.

Use a trusted workspace: its run history can include the receipt, file and private result link. Anyone with the receipt can retrieve the output. The 100 sponsored slots per UTC month are shared across all anonymous channels. When the allowance is exhausted, the workflow stops; it will never switch to paid processing.

## Use your own Weydub credits

In a Dify 1.20.0 or later workspace that accepts unsigned plugins, go to **Plugins → Install Plugin → GitHub**. Enter `https://github.com/JollyToday/GhostCut-auto_video_translation`, choose `weydub-dify-v0.1.1`, then select `subtitle-removal-0.1.1.difypkg`. Check that the preview says **Weydub Pro Subtitle Removal** before installing.

If your version selector does not show that tag yet, [download the package directly](https://github.com/JollyToday/GhostCut-auto_video_translation/releases/download/weydub-dify-v0.1.1/subtitle-removal-0.1.1.difypkg) and choose **Local Package**. Both routes use the same unsigned file. If your workspace requires a Marketplace signature, use the sponsored Studio workflow above where workspace policy allows it.

Already using the 0.1.0 local package? Check the version under **Installed Plugins** after uploading. In Community Edition 1.20.0 an upload can finish while 0.1.0 remains active. In that case, schedule the change when no workflows are running, keep your configuration and saved work IDs, uninstall the old package, then install 0.1.1. Confirm the installed version and check an existing work ID before submitting another clip.

Connect your Weydub account in the plugin settings using the [plugin guide](../../integrations/dify/README.md). Connecting checks credentials without starting a job. Keep your key and secret out of the workflow inputs.

For a first test, use the [15-second clip with captions in three positions](../full-frame-removal/). The example includes a direct input URL for Studio and a real output you can inspect without running the workflow.

In **Studio**, choose **Import DSL File** for each of these two files. They work independently and do not require an LLM.

| Workflow | What to enter | What you get |
|---|---|---|
| [Remove burned-in subtitles](submit-removal.yml) | A direct HTTPS link to a video you have permission to edit. Run once. | A `work_id`. Save it. Full-frame Pro uses Weydub credits and may also erase signs, prices or logos. |
| [Check a subtitle removal](check-removal.yml) | The saved `work_id`, using the same connected account. | `state` and `result`. When ready, `result` includes the private MP4 download link. |

If the status is `processing`, come back in about five minutes and run **Check a subtitle removal** again with the same ID. If the first workflow times out before showing an ID, check your Weydub job history before submitting again. For a clip where signs or product labels must stay, use [the Weydub subtitle removal editor](https://weydub.com/subtitle-removal/) to select the caption area.
