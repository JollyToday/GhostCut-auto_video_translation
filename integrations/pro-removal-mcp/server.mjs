import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {preview, service} from './service.mjs';

const server = new McpServer({name:'weydub-pro-removal', version:'1.0.0'});
const api = service({key:process.env.WEYDUB_APP_KEY,secret:process.env.WEYDUB_APP_SECRET});
const url = z.string().max(8192).describe('Direct HTTPS link to a video you own or have permission to process.');
function answer(action) {
  return async input => {
    try {
      const result = await action(input);
      return {content:[{type:'text', text:JSON.stringify(result)}], structuredContent:result};
    } catch (error) {
      return {isError:true, content:[{type:'text', text:error.message}]};
    }
  };
}
server.registerTool('preview_removal',{
  description:'Check the source URL format and show the full-frame Pro settings without fetching any video, starting a job or spending credits.',
  inputSchema:{video_url:url}, annotations:{readOnlyHint:true,idempotentHint:true,openWorldHint:false}
},answer(({video_url})=>preview(video_url)));
server.registerTool('submit_removal',{
  description:'Start one billable full-frame Pro job. Use only after explicit approval. Save the work ID and do not retry on timeout. Signs, prices and logos may also be removed.',
  inputSchema:{video_url:url,confirm_charge:z.literal(true).describe('Set true only with user approval to spend Weydub credits on this video.')},
  annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:false,openWorldHint:true}
},answer(({video_url,confirm_charge})=>api.submit(video_url,confirm_charge)));
server.registerTool('check_removal',{
  description:'Look up one existing work ID. Returns processing, failed, or ready with a private MP4 download URL. Never starts a new job.',
  inputSchema:{work_id:z.string().regex(/^[1-9]\d{0,19}$/)},
  annotations:{readOnlyHint:true,idempotentHint:true,openWorldHint:true}
},answer(({work_id})=>api.status(work_id)));
await server.connect(new StdioServerTransport());
