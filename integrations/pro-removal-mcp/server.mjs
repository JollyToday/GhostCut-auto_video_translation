import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {preview, service} from './service.mjs';
import {trialService} from './trial.mjs';

const server = new McpServer({name:'weydub-pro-removal', version:'1.1.0'});
const trial = trialService(process.argv.length===3 ? process.argv[2] : null);
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
server.registerTool('submit_trial_clip',{
  description:'Send input.mp4 from the configured clip folder for sponsored full-frame Pro subtitle removal. Requires permission to upload. Up to 60 seconds and 16 MiB. No key or paid fallback.',
  inputSchema:{confirm_upload:z.literal(true).describe('Confirm the user may send this clip to Weydub and wants to upload it.')},
  annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:true}
},answer(({confirm_upload})=>trial.submit(confirm_upload)));
server.registerTool('save_trial_result',{
  description:'Check the saved receipt and, when ready, save cleaned.mp4 to the same clip folder. Never starts a job or overwrites an existing file.',
  inputSchema:{}, annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:true}
},answer(()=>trial.save()));
await server.connect(new StdioServerTransport());
