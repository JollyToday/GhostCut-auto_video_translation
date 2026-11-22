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
| 4. Claim and save | `POST /delivery` | No body. The first successful claim is the metered operation. Open the private `videoUrl`, download the MP4 and check the same frame. Keep the receipt for a retry if the download is interrupted. |

The origin reports zero units for issuing, uploading and checking; the first claim reports one unit per started 30 seconds and repeat claims on the same receipt report zero. Record the **subscriber** usage before the upload, before the first claim, after the claim and after one repeat. For this clip the expected changes are `0, 1, 0`. The origin response is not proof of what the marketplace charged.

## From a terminal

Use Node.js 22+ and set `API_MARKET_BUYER_KEY` privately in your environment. Run these commands from this example's directory, keeping `receipt.txt` and the output in a private directory outside the repository:

```sh
mkdir -m 700 "$HOME/weydub-test"
node buyer.mjs receipt "$HOME/weydub-test/receipt.txt"
node buyer.mjs upload "$HOME/weydub-test/receipt.txt" practice-6s.mp4
node buyer.mjs status "$HOME/weydub-test/receipt.txt"
node buyer.mjs claim "$HOME/weydub-test/receipt.txt" "$HOME/weydub-test/cleaned.mp4" --confirm-claim
```

Upload accepts one H.264 MP4 up to 60 seconds and 16 MiB. The client refuses to overwrite an existing receipt or MP4 and never prints the receipt, key or signed URL. If a claim's response is lost, keep the same receipt. After `failed`, `needs_review` or `expired`, check with support before sending the file again.

**A 403 before you see a receipt?** If the response includes `receipt_access`, the request reached Weydub but the origin rejected receipt access. `media_access` on a later operation means the origin rejected that media operation. Give support the operation, HTTP status and diagnostic code; don't send your key or receipt. A generic HTML 403 doesn't identify which system rejected the request.
