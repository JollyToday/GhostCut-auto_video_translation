import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {service} from "../pro-removal-mcp/service.mjs";
import {modules,universal} from "./app.mjs";

test("image preview and submitted image use the same nested downloadInfo contract", () => {
  const {mappable,communication} = modules.image;
  const allowed = new RegExp(mappable.find(p => p.name === "mediaUrl").validate.pattern);
  for (const url of ["https://media.example/image.webp", "https://media.example/a%20b.jpg?size=12&src=one"]) {
    assert.ok(allowed.test(url));
    for (const payload of [communication.condition.default.requestPreview, communication.temp.payload]) {
      assert.deepEqual(JSON.parse(payload.downloadInfo.replace("{{parameters.mediaUrl}}",url)), {url});
    }
  }
  for (const url of ['https://media.example/a"b.png', 'https://media.example/a\\b.png', 'http://media.example/a.png']) {
    assert.equal(allowed.test(url), false);
  }
  assert.equal(communication.condition.default.state, "preview");
  assert.equal(mappable.find(p => p.name === "submit").default, false);
});

const bp = JSON.parse(readFileSync(new URL("./blueprints/remove-full-frame-pro.json", import.meta.url)));
const [inputs, create] = bp.flow;
const defaults = Object.fromEntries(inputs.mapper.variables.map(v => [v.name, v.value]));

test("Pro import starts without approval and its filter ties approval to the selected clip", () => {
  assert.equal(defaults.approvedVideoUrl, "");
  assert.equal(bp.flow.length, 2);
  assert.equal(inputs.module, "util:SetVariables");
  assert.equal(create.module.split(":")[1], universal.name);
  assert.deepEqual(create.parameters, {}); // Never distribute a provider connection ID.
  const permits = vars => {
    const value = token => token.startsWith("{{") ? vars[token.slice(4,-2)] : token;
    const ops = {"text:startwith": (a,b) => a.startsWith(b), "text:equal": (a,b) => a === b};
    return create.filter.conditions.some(group => group.every(({a,o,b}) => ops[o](value(a), value(b))));
  };
  const approved = {...defaults, approvedVideoUrl:defaults.videoUrl};
  assert.equal(permits(defaults), false);
  assert.equal(permits(approved), true);
  assert.equal(permits({...approved, videoUrl:"https://example.com/changed.mp4"}), false);
  assert.equal(permits({videoUrl:"", approvedVideoUrl:""}), false);
  assert.equal(permits({videoUrl:"http://example.com/a.mp4", approvedVideoUrl:"http://example.com/a.mp4"}), false);
  assert.equal(new RegExp(universal.mappable[0].validate.pattern).test(""), false);
});

test("Pro payload matches the signed reference request, including nested options and escaped URLs", async () => {
  for (const video of [defaults.videoUrl, 'https://example.com/clip.mp4?label="One"&lang=en']) {
    let wire;
    const client = service({key:"fixture", secret:"fixture", request:async (url, options) => {
      wire = {path:new URL(url).pathname, body:options.body};
      return Response.json({code:1000, body:{dataList:[{id:123}]}});
    }});
    await client.submit(video, true);
    assert.ok(wire.path.endsWith("/work/free"));
    const body = create.mapper.jsonBody.replace("{{escapeJSON(1.videoUrl)}}", () => JSON.stringify(video).slice(1,-1));
    assert.equal(body, wire.body);
  }
});

test("universal requests accept media gateway paths without credentials crossing origins",()=>{
  const pattern=new RegExp(universal.mappable[0].validate.pattern);
  const c=universal.communication;
  for(const path of ["/point/query","/image/translate/query","/work/translationPro"]) {
    assert.ok(pattern.test(path));
    const u=new URL(c.url.replace("{{substring(parameters.path, 1)}}",path.slice(1)));
    assert.equal(u.origin,"https://api.zhaoli.com");
    assert.equal(u.pathname,"/v-w-c/gateway/ve"+path);
  }
  for(const path of ["https://example.com","//example.com","/../account","/%2Fnext","/work?next=elsewhere","/a\\b"]) assert.equal(pattern.test(path),false);
  assert.equal(c.followAllRedirects,false);
  assert.equal(c.followRedirects,false);
  assert.equal(c.body,"{{temp.wire}}");
  assert.match(c.headers.AppSign,/md5\(temp\.wire\)/);
});
