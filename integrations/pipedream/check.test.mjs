import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";

const actions = {};
for (const name of await readdir(new URL("./actions/", import.meta.url))) {
  actions[name] = (await import(`./actions/${name}/${name}.mjs`)).default;
}
const creds = { $auth: { app_key: "test-key", app_secret: "test-secret" } };
const props = { source: "zh", target: "en", mediaUrl: "https://example.org/clip?file=demo%20clip", submit: true, weydub: creds };
const run = (key, fields) => actions[key].run.call(fields, { $: { export() {} } });
const ok = (body) => Response.json({ code: 1000, body });
const md5 = (text) => createHash("md5").update(text).digest("hex");

test("six separate actions; all four previews are offline and redact private media URLs", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => { throw Error("unexpected network request"); });
  assert.equal(Object.keys(actions).length, 6);
  for (const key of ["remove-video-text", "extract-subtitles", "dub-video", "translate-image"]) {
    assert.equal(actions[key].props.submit.default, false);
    assert.deepEqual(await run(key, { ...props, weydub: null, submit: false }), { state: "preview", action: key });
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("submission signs the exact wire payload and returns the right kind of job ID", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, req) => {
    assert.equal(new URL(url).origin, "https://api.zhaoli.com");
    assert.equal(req.redirect, "error");
    assert.equal(req.headers.AppSign, md5(md5(req.body) + "test-secret"));
    requests.push(JSON.parse(req.body));
    return ok(url.endsWith("/image/translate") ? 42 : { idProject: 87, dataList: [{ id: 41 }] });
  });
  for (const key of ["remove-video-text", "extract-subtitles", "dub-video", "translate-image"]) {
    const out = await run(key, props);
    assert.equal(out.jobId, key === "translate-image" ? "42" : "41");
    assert.equal(out.nextAction, key === "translate-image" ? "weydub-get-image-result" : "weydub-get-video-result");
  }
  assert.equal(JSON.parse(requests[0].extraOptions).extra_inpaint_config.model, "advanced_lite");
  assert.deepEqual(JSON.parse(requests[1].videoInpaintMasks)[0].region, [[0,0],[1,0],[1,1],[0,1]]);
  assert.equal(requests[1].videoInpaintLang, "zh");
  assert.equal(requests[2].incorporatePro, true);
  assert.deepEqual(JSON.parse(requests[3].downloadInfo), { url: props.mediaUrl });
});

test("lookups call only read endpoints, match work IDs, and handle stringified image results", async (t) => {
  let polls = 0;
  t.mock.method(globalThis, "fetch", async (url, req) => {
    const body = JSON.parse(req.body);
    if (url.endsWith("/work/status")) {
      assert.deepEqual(body.idWorks, ["51"]);
      return ok({ content: [{ id: 50, processStatus: 1, videoUrl: "other" }, { id: 51, processStatus: 1, srcSrtUrl: "captions.srt" }] });
    }
    assert.ok(url.endsWith("/image/translate/query"));
    assert.equal(body.id, 51);
    return ok(++polls === 1 ? { status: 0, result: null } : { status: 1, result: JSON.stringify({ output_url: "translated.webp", inpaint_url: "clean.webp" }) });
  });
  const input = { weydub: creds, jobId: "51" };
  const video = await run("get-video-result", input);
  assert.equal(video.sourceSrtUrl, "captions.srt");
  assert.equal(video.videoUrl, null);
  assert.equal((await run("get-image-result", input)).imageUrl, null);
  assert.equal((await run("get-image-result", input)).imageUrl, "translated.webp");
});

test("bad input cannot submit; an uncertain or unfunded job is never replayed", async (t) => {
  const fn = t.mock.method(globalThis, "fetch", async () => Response.json({ code: 4005 }));
  await assert.rejects(run("remove-video-text", { ...props, mediaUrl: "http://example.org/a" }), /HTTPS/);
  await assert.rejects(run("get-image-result", { ...props, jobId: "9007199254740992" }), /positive job ID/);
  await assert.rejects(run("translate-image", { ...props, weydub: null }), /Connect your own/);
  assert.equal(fn.mock.callCount(), 0);
  await assert.rejects(run("translate-image", props), /4005/);
  fn.mock.mockImplementation(async () => { throw Error("timeout"); });
  await assert.rejects(run("dub-video", props), /Check your task list/);
  assert.equal(fn.mock.callCount(), 2);
});
