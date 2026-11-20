'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {createRequire} = require('node:module');
const fromConsumer = createRequire(path.resolve(process.argv[2], 'package.json'));
const load = createRequire(fromConsumer.resolve('n8n-nodes-weydub/package.json'));
const manifest = load('./package.json');
const {Weydub} = load('./' + manifest.n8n.nodes[0]);
const {WeydubApi} = load('./' + manifest.n8n.credentials[0]);

async function check() {
  const node = new Weydub();
  assert.equal(node.description.credentials[0].name, new WeydubApi().name);
  for (const op of ['ocr', 'image']) {
    const workflow = load(`./examples/preview-${op}.json`);
    const entry = workflow.nodes.find(n => n.type === `${manifest.name}.${node.description.name}`);
    assert.equal(entry.parameters.submit, false);
    const [[{json: result}]] = await node.execute.call({
      getInputData: () => [{json:{}}],
      getNodeParameter: (k, i, fallback) => entry.parameters[k] ?? fallback,
      continueOnFail: () => false,
    });
    assert.equal(result.state, 'preview');
    if (op === 'image') {
      assert.equal(JSON.parse(result.body.downloadInfo).url, entry.parameters.mediaUrl);
      assert.equal(result.body.synthesisOn, 1);
    } else {
      assert.deepEqual(JSON.parse(result.body.videoInpaintMasks)[0].region, [[0,0],[1,0],[1,1],[0,1]]);
      assert.equal(result.body.videoInpaintLang, entry.parameters.source);
    }
  }
}
check().catch(error => {console.error(error); process.exitCode = 1;});
