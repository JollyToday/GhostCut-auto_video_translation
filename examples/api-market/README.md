# Test Weydub Pro Subtitle Removal in API.market

Weydub's API.market product is under revision. This guide is for a reviewer or tester who **already has access to its test plan**. It is not an offer to purchase a public plan. Use your own API.market subscriber key, not a direct Weydub or RapidAPI key.

**Try a six-second clip:** [Download the captioned MP4](https://raw.githubusercontent.com/JollyToday/GhostCut-auto_video_translation/main/examples/api-market/practice-6s.mp4). It is an excerpt from the licensed [Wrong Cup example and real before/after comparison](../full-frame-removal/). Pause around 1.8 seconds: the caption crosses the speaker's forehead, above the usual subtitle band. When you try your own clip, use one you can share with Weydub; full-frame Pro can also erase signs or product labels. [Select an area instead in Weydub](https://weydub.com/subtitle-removal/).

![At 1.8 seconds: captioned input at left, same frame after actual Pro processing at right.](comparison.jpg)

[Download the processed MP4](https://raw.githubusercontent.com/JollyToday/GhostCut-auto_video_translation/main/examples/api-market/pro-6s.mp4). This result came from a test of Weydub's processing service using the example client. You can compare the files without subscribing or submitting a job.

## In the buyer Playground

Open **API Playground** for the subscribed product. The route prefix is `https://prod.api.market/api/v1/weydub/pro-subtitle-removal`; API.market supplies your subscription key. Do not enter seller forwarding headers.

| Step | Request | What to do or look for |
| --- | --- | --- |
| 1. Get a receipt | `POST /receipts` | No body. Save the returned `receipt` privately. For steps 2–4 set `X-Removal-Receipt` to this same value. |
| 2. Upload the file | `POST /removal` | Select a **binary** body, `Content-Type: video/mp4`, and choose `practice-6s.mp4`. Do not paste a URL or send multipart form data. A new job returns `202` and `unitsOnDelivery: 1` for this clip. |
| 3. Check this job | `GET /removal` | No body. While `queued`, `submitting` or `processing`, repeat **only step 3**. `ready` means the result is available; status does not claim it. |
| 4. Claim and save | `POST /delivery` | No body. The first successful claim is the metered operation. Save the private `videoUrl` immediately, open it to download the MP4 and check the same frame. While that link is valid, you can download again without making another API.market request. |

The origin reports zero units for issuing, uploading and checking; the first claim reports one unit per started 30 seconds and repeat claims on the same receipt report zero. Record the **subscriber** usage before the upload, before the first claim, after the claim and after one repeat. For this clip the expected changes are `0, 1, 0`. The origin response is not proof of what the marketplace charged.

## From a terminal

Use Node.js 22+ and set `API_MARKET_BUYER_KEY` privately in your environment. Run these commands from this example's directory, keeping the receipt, download link and output in a private directory outside the repository:

```sh
node buyer.mjs usage
mkdir -m 700 "$HOME/weydub-test"
node buyer.mjs receipt "$HOME/weydub-test/receipt.txt"
node buyer.mjs upload "$HOME/weydub-test/receipt.txt" practice-6s.mp4
node buyer.mjs status "$HOME/weydub-test/receipt.txt"
node buyer.mjs claim-link "$HOME/weydub-test/receipt.txt" "$HOME/weydub-test/download.txt" --confirm-claim
node buyer.mjs download "$HOME/weydub-test/download.txt" "$HOME/weydub-test/cleaned.mp4"
```

`usage` reads this product's [API.market subscriber counters](https://docs.api.market/api.market-usage-api-documentation) without uploading or claiming a file. If no subscription is found, check the plan before starting. To verify the six-second test, read `usage` before upload, when ready, after the first claim, and after one deliberate repeat claim. Compare readings from the same billing cycle and an otherwise idle test subscription. If you just need the video again, use `download` on the saved link instead.

**If the download breaks:** rerun only `download` using the saved link. It needs no subscriber key and does not call the metered endpoint. Anyone with the link can retrieve the video until it expires. If the claim response itself was lost before the link was saved, keep the original receipt and check your subscriber usage before retrying. The one-command `claim RECEIPT_FILE NEW_OUTPUT.mp4 --confirm-claim` still works in existing scripts.

Upload accepts one H.264 MP4 up to 60 seconds and 16 MiB. The client refuses to overwrite existing output files and never prints the receipt, key or signed URL. After `failed`, `needs_review` or `expired`, check with support before sending the file again.

**`400 No active Subscription` before you get a receipt?** Check that the account owning the buyer key has an active subscription to this specific product. Signing in and opening the Playground does not activate a plan. There is no clip or receipt to submit again at this point.

**A 403 before you see a receipt?** If the response includes `receipt_access`, the request reached Weydub but the origin rejected receipt access. `media_access` on a later operation means the origin rejected that media operation. Give support the operation, HTTP status and diagnostic code; don't send your key or receipt. A generic HTML 403 doesn't identify which system rejected the request.
