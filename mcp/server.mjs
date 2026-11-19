import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const run=promisify(execFile);
const cli=fileURLToPath(new URL('../examples/media.mjs',import.meta.url));
const server=new McpServer({name:'weydub-media',version:'1.0.0'});
const lang=z.string().regex(/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$/);
const common={
  url:z.string().url().startsWith('https://').describe('Downloadable HTTPS link to media you may process.'),
  submit:z.boolean().default(false).describe('False previews without spending credits. True creates one billable job.'),
};
const jobs=[
  ['remove_video_subtitles','erase','Remove burned-in captions in the bottom 18% of a video with Lite inpainting.',{}],
  ['extract_video_subtitles','ocr','Read the entire frame and return timed subtitles in the source language.',{source:lang.describe('Language of the on-screen writing.')}],
  ['translate_and_dub_video','dub','Translate speech and generate high-emotion dubbing for an authorized voice. Original burned-in captions remain.',{source:lang,target:lang}],
  ['translate_image','image','Translate text in a product image and render the translated image.',{source:lang,target:lang}],
];
async function call(args){
  try {
    const {stdout}=await run(process.execPath,[cli,...args],{timeout:55000,maxBuffer:256000});
    return {content:[{type:'text',text:stdout.trim()}]};
  } catch(error){
    const message=String(error.stderr||'').match(/Error: (Set WEYDUB_APP_KEY.*|Gateway business code \d+\.|Gateway returned HTTP \d+\.|Job not found for these credentials\.)/);
    return {isError:true,content:[{type:'text',text:message?.[1]||'No confirmed result. Check your job list before resubmitting a creation request.'}]};
  }
}
for(const [name,action,description,extra] of jobs){
  server.registerTool(name,{description,inputSchema:{...common,...extra},annotations:{readOnlyHint:false,idempotentHint:false,openWorldHint:true}},
    async ({url,source,target,submit})=>call([action,url,...(source?['--source',source]:[]),...(target?['--target',target]:[]),...(submit?['--submit']:[])]));
}
server.registerTool('check_job',{description:'Check a job you already submitted. Video includes OCR, erasure and dubbing. Returns result URLs when complete.',
  inputSchema:{kind:z.enum(['video','image']),id:z.string().regex(/^[1-9]\d*$/)},annotations:{readOnlyHint:true,idempotentHint:true,openWorldHint:true}},
  async ({kind,id})=>call([`${kind}-status`,id]));
await server.connect(new StdioServerTransport());
