import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const image = process.argv[2];
assert.ok(image, 'Pass the local image tag or ID.');
const client = new Client({name:'weydub-image-check', version:'1'});
try {
  await client.connect(new StdioClientTransport({command:'docker', args:[
    'run','--rm','-i','--pull=never','--network=none','--read-only','--cap-drop=ALL',
    '--security-opt=no-new-privileges', image,
  ]}));
  const {tools} = await client.listTools();
  assert.deepEqual(tools.map(t=>t.name).sort(), ['check_removal','preview_removal','submit_removal']);
  const result = await client.callTool({name:'preview_removal',arguments:{video_url:'https://example.com/clip.mp4'}});
  assert.deepEqual(result.structuredContent, {
    state:'preview', source_host:'example.com', model:'Pro', region:'full frame', billable:false,
  });
  console.log('MCP discovery and full-frame Pro preview passed with no account or network.');
} finally {
  await client.close();
}
