"""Relay authorized uploads to the single shared allowance; never attach BYO credentials."""
import asyncio
import re

import httpx
from starlette.requests import ClientDisconnect
from starlette.responses import JSONResponse
from starlette.routing import Route

ENDPOINT = "https://api.weydub.com/agent-trial/v1/removal"
LIMIT = 16 * 1024 * 1024
SLOTS = asyncio.Semaphore(4)
STATES = {"queued", "submitting", "processing", "ready", "failed", "needs_review"}


def reply(code, data):
    return JSONResponse(data, status_code=code, headers={"Cache-Control": "no-store"})


async def relay(request):
    if request.method not in {"GET", "POST"}:
        return reply(405, {"error": "Use GET to check a receipt or POST to submit a clip."})
    receipt = request.headers.get("x-trial-receipt", "")
    if not re.fullmatch(r"[0-9a-f]{64}", receipt):
        return reply(400, {"error": "A valid private receipt is required."})
    headers = {"X-Trial-Receipt": receipt}
    submit = request.method == "POST"
    if submit:
        if request.headers.get("x-confirm-upload") != "yes":
            return reply(400, {"error": "Confirm you have permission to send this clip."})
        if request.headers.get("content-type") != "video/mp4":
            return reply(415, {"error": "Choose an H.264 MP4."})
        length = request.headers.get("content-length", "")
        if not re.fullmatch(r"[0-9]{1,8}", length) or not 16 <= int(length) <= LIMIT:
            return reply(413, {"error": "Choose an MP4 up to 16 MiB and 60 seconds."})
        headers["Content-Type"] = "video/mp4"
    if SLOTS.locked():
        return reply(503, {"error": "The Space is busy. Try again with this receipt."})
    async with SLOTS:
        body = None
        if submit:
            body = bytearray()
            try:
                async with asyncio.timeout(60):
                    async for chunk in request.stream():
                        if len(body) + len(chunk) > int(length):
                            return reply(413, {"error": "The upload exceeded its declared size."})
                        body.extend(chunk)
            except (TimeoutError, ClientDisconnect):
                return reply(408, {"error": "Upload interrupted. Retry with the same receipt."})
            if len(body) != int(length):
                return reply(400, {"error": "The upload was incomplete."})
        try:
            async with httpx.AsyncClient(follow_redirects=False, timeout=75) as client:
                response = await client.request(request.method, ENDPOINT, headers=headers,
                                                content=bytes(body) if body is not None else None)
            if response.status_code in {400, 404, 409, 413, 415, 422, 429, 503}:
                errors = response.json()
                return reply(response.status_code, {"error": str(errors.get("error", "Check this receipt."))[:240]})
            if response.status_code in {200, 202}:
                data = response.json()
                state = data.get("state")
                if state in STATES:
                    result = {"state": state}
                    if state == "ready" and not submit:
                        url = httpx.URL(data["videoUrl"])
                        if url.scheme != "https" or not url.host or url.userinfo:
                            raise ValueError("Unusable result")
                        result["videoUrl"] = str(url)
                    return reply(response.status_code, result)
        except (ValueError, TypeError, AttributeError, KeyError, httpx.HTTPError, httpx.InvalidURL):
            pass
    return reply(502, {"error": "Could not confirm the result. Check status with the same receipt before retrying."})


def routes():
    # Gradio SSR proxies ordinary paths to its frontend renderer. Keep the
    # relay under Gradio's internal API prefix so GET and POST reach Starlette.
    return [Route("/gradio_api/sponsored-removal", relay, methods=["GET", "POST"])]
