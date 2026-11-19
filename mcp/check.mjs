import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const client=new Client({name:'weydub-package-check',version:'1.0.0'});
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>['PATH','HOME','WEYDUB_APP_KEY','WEYDUB_APP_SECRET'].includes(k)));
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],env});
await client.connect(transport);
try {
  const tools=await client.listTools();
  assert.equal(tools.tools.length,5);
  const preview=await client.callTool({name:'extract_video_subtitles',arguments:{url:'https://example.org/sample.mp4',source:'zh'}});
  assert.match(preview.content[0].text,/Preview:/);
  assert.match(preview.content[0].text,/0,0.*1,0.*1,1.*0,1/);
  if(process.env.WEYDUB_TEST_WORK_ID){
    const result=await client.callTool({name:'check_job',arguments:{kind:'video',id:process.env.WEYDUB_TEST_WORK_ID}});
    assert.equal(result.isError,undefined);assert.equal(JSON.parse(result.content[0].text).status,1);
    console.log('Authenticated status call succeeded');
  }
  console.log('MCP handshake, five tools, and full-frame OCR preview passed');
}finally{await client.close();}
