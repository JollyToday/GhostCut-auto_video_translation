import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, join, resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const archive=resolve(process.argv[2]);
const entries=execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:8*1024*1024}).trim().split('\n');
const top=entries.filter(p=>!p.startsWith('package/node_modules/'));
assert.deepEqual(top.sort(),['cli.mjs','server.mjs','service.mjs','trial.mjs','README.md','LICENSE','package.json'].map(x=>'package/'+x).sort());
assert.ok(entries.includes('package/node_modules/@modelcontextprotocol/sdk/package.json'));
const root=await mkdtemp(join(tmpdir(),'weydub-offline-install-'));
const client=new Client({name:'weydub-release-check',version:'1'});
try {
  await client.connect(new StdioClientTransport({command:'npx',args:['--offline','--yes','--package',archive,'weydub-pro-removal'],cwd:root,
    env:{PATH:process.env.PATH,HOME:root,npm_config_cache:join(root,'cache'),npm_config_registry:'http://127.0.0.1:1'}}));
  assert.deepEqual((await client.listTools()).tools.map(t=>t.name).sort(),
    ['check_removal','preview_removal','save_trial_result','submit_removal','submit_trial_clip']);
  const preview=await client.callTool({name:'preview_removal',arguments:{video_url:'https://example.com/clip.mp4'}});
  assert.equal(preview.structuredContent.region,'full frame');
  assert.equal(preview.structuredContent.billable,false);
  const result=await client.callTool({name:'save_trial_result',arguments:{}});
  assert.match(result.content[0].text,/No trial receipt/);
  assert.deepEqual(await readdir(join(root,'Weydub-Trial')),[]);
  console.log(`${basename(archive)}: verified package contents, offline install, default folder and five tools`);
} finally {
  await client.close();
  await rm(root,{recursive:true,force:true});
}
