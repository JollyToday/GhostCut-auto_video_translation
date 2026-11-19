import assert from "node:assert/strict";
import test from "node:test";
import {modules} from "./app.mjs";

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
