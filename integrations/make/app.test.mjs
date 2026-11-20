import assert from "node:assert/strict";
import test from "node:test";
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
