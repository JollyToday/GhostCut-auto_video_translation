import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const actions = {};
for (const name of await readdir(new URL("./actions/", import.meta.url))) {
  actions[name] = (await import(`./actions/${name}/${name}.mjs`)).default;
}
const creds = { $auth: { app_key: "test-key", app_secret: "test-secret" } };
const props = { source: "zh", target: "en", mediaUrl: "https://example.org/clip?file=demo%20clip", submit: true, weydub: creds };
const run = (key, fields) => actions[key].run.call(fields, { $: { export() {} } });
const ok = (body) => Response.json({ code: 1000, body });
const md5 = (text) => createHash("md5").update(text).digest("hex");

test("the registry's static version check and path-based publisher agree with the runtime actions", async () => {
  for (const [slug, action] of Object.entries(actions)) {
    const source = await readFile(new URL(`./actions/${slug}/${slug}.mjs`, import.meta.url), "utf8");
    const literal = field => source.match(new RegExp(`${field}:\\s*["']([^"']+)["']`))?.[1];
    assert.equal(literal("key"), `weydub-${slug}`);
    assert.equal(literal("key"), action.key);
    assert.match(literal("version") ?? "", /^\d+\.\d+\.\d+$/);
    assert.equal(literal("version"), action.version);
    const readOnly = slug.startsWith("get-");
    assert.deepEqual(action.annotations, {destructiveHint: !readOnly, openWorldHint: !readOnly, readOnlyHint: readOnly});
  }
});

test("the first registry handoff loads independently and only publishes Pro and its lookup", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "weydub-registry-"));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const root = new URL("./", import.meta.url);
  const files = (await readFile(new URL("registry-files.txt", root), "utf8")).trim().split(/\r?\n/);
  const slugs = ["get-video-result", "remove-subtitles-pro"];
  assert.deepEqual(files.filter(f => /\.[cm]?js$/.test(f) && !f.startsWith("common/")).sort(), slugs.map(s => `actions/${s}/${s}.mjs`));
  await copyFile(new URL("weydub.app.mjs", root), join(dir, "weydub.app.mjs"));
  for (const f of files) {
    assert.match(f, /^(?:common|actions)\/[\w./-]+$/);
    assert.ok(!f.includes(".."));
    await mkdir(dirname(join(dir, f)), {recursive: true});
    await copyFile(new URL(f, root), join(dir, f));
  }
  const [lookup, pro] = await Promise.all(slugs.map(async s => (await import(pathToFileURL(join(dir, "actions", s, `${s}.mjs`)))).default));
  const poll = t.mock.method(globalThis, "fetch", async (url, request) => {
    assert.equal(new URL(url).pathname, "/v-w-c/gateway/ve/work/status");
    assert.deepEqual(JSON.parse(request.body), {idWorks: ["13"]});
    return ok({content: [{id: 13, processStatus: 1, videoUrl: "https://example.org/output.mp4"}]});
  });
  const ctx = {$: {export() {}}};
  assert.equal((await pro.run.call({mediaUrl: props.mediaUrl}, ctx)).state, "preview");
  assert.equal(poll.mock.callCount(), 0);
  assert.equal((await lookup.run.call({weydub: creds, jobId: "13", expectedOutput: "mp4"}, ctx)).videoUrl, "https://example.org/output.mp4");
  assert.equal(poll.mock.callCount(), 1);
});

test("all five create actions preview offline without exposing private media URLs", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => { throw Error("unexpected network request"); });
  for (const key of ["remove-subtitles-pro","remove-video-text", "extract-subtitles", "dub-video", "translate-image"]) {
    assert.equal(actions[key].props.submit.default, false);
    assert.deepEqual(await run(key, { ...props, weydub: null, submit: false }), { state: "preview", action: key });
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("full-frame Pro and legacy lower-band Lite are separate billable requests", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, req) => {
    requests.push(JSON.parse(req.body));
    assert.equal(new URL(url).pathname, "/v-w-c/gateway/ve/work/free");
    assert.equal(req.headers.AppSign, md5(md5(req.body) + "test-secret"));
    return ok({dataList:[{id:17}]});
  });
  assert.equal((await run("remove-subtitles-pro",{mediaUrl:props.mediaUrl,submit:true,weydub:creds})).nextAction,"weydub-get-video-result");
  await run("remove-video-text", props);
  const [pro,lite] = requests;
  assert.deepEqual(pro.urls,[props.mediaUrl]);
  assert.equal(pro.needChineseOcclude,1);
  assert.equal(pro.videoInpaintLang,"all");
  assert.equal(JSON.parse(pro.extraOptions).extra_inpaint_config.model,"advanced_full");
  assert.equal(pro.videoInpaintMasks,undefined);
  assert.equal(JSON.parse(lite.extraOptions).extra_inpaint_config.model,"advanced_lite");
  assert.deepEqual(JSON.parse(lite.videoInpaintMasks)[0].region,[[0,0.82],[1,0.82],[1,1],[0,1]]);
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
      return ok({ content: [{ id: 50, processStatus: 1, videoUrl: "https://example.org/other.mp4" }, { id: 51, processStatus: 1, srcSrtUrl: "https://example.org/captions.srt" }] });
    }
    assert.ok(url.endsWith("/image/translate/query"));
    assert.equal(body.id, 51);
    return ok(++polls === 1 ? { id: 51, status: 0, result: null } : { id: "51", status: 1, result: JSON.stringify({ output_url: "translated.webp", inpaint_url: "clean.webp" }) });
  });
  const input = { weydub: creds, jobId: "51" };
  const video = await run("get-video-result", input);
  assert.equal(video.sourceSrtUrl, "https://example.org/captions.srt");
  assert.equal(video.videoUrl, null);
  assert.equal((await run("get-image-result", input)).imageUrl, null);
  assert.equal((await run("get-image-result", input)).imageUrl, "translated.webp");
});

test("wrong or incomplete image results cannot be delivered; credit states preserve the work ID", async (t) => {
  const input = {weydub: creds, jobId: "51"};
  const f = t.mock.method(globalThis, "fetch", async () => ok({id: 52, status: 1, result: {output_url: "unrelated.webp"}}));
  await assert.rejects(run("get-image-result", input), /No matching image job/);
  f.mock.mockImplementation(async () => ok({id: 51, status: 1, result: {inpaint_url: "background.webp"}}));
  await assert.rejects(run("get-image-result", input), /without a translated image/);
  for (const [code, message] of [[73, /not started/], [83, /output is locked/]]) {
    f.mock.mockImplementation(async () => ok({content: [{id: 51, processStatus: code, videoUrl: "unreleased.mp4"}]}));
    const result = await run("get-video-result", input);
    assert.match(result.statusMessage, message);
    assert.equal(result.jobId, "51");
    assert.equal(result.videoUrl, null);
  }
});

test("a completed lookup must include the selected deliverable, without starting another job", async (t) => {
  let result = {};
  const fn = t.mock.method(globalThis, "fetch", async (url, req) => {
    assert.ok(url.endsWith("/work/status"));
    assert.deepEqual(JSON.parse(req.body), { idWorks: ["51"] });
    return ok({ content: [{ id: 51, processStatus: 1, ...result }] });
  });
  const lookup = (expectedOutput) => run("get-video-result", { weydub: creds, jobId: "51", expectedOutput });
  await assert.rejects(lookup(), /Job 51.*no download link/);
  result = {videoUrl: "pending", srcSrtUrl: "not-a-link"};
  await assert.rejects(lookup("mp4"), /no MP4 link/);
  result = {srcSrtUrl: "https://example.org/source.srt"};
  await assert.rejects(lookup("mp4"), /no MP4 link/);
  assert.equal((await lookup("source-srt")).sourceSrtUrl, result.srcSrtUrl);
  assert.equal((await lookup()).sourceSrtUrl, result.srcSrtUrl);
  result = {videoUrl: "https://example.org/clean.mp4"};
  await assert.rejects(lookup("source-srt"), /no source SRT link/);
  assert.equal((await lookup("mp4")).videoUrl, result.videoUrl);
  result = {processStatus: 0};
  assert.equal((await lookup("mp4")).status, 0);
  assert.equal(fn.mock.callCount(), 8);
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
