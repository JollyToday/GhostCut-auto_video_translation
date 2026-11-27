#!/usr/bin/env node
import {mkdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {startServer} from './server.mjs';
import {clipFolder, checkFolder} from './trial.mjs';

const args=process.argv.slice(2);
if (args.length>1) throw Error('Usage: weydub-pro-removal [absolute-clip-folder]');
const dir=clipFolder(args[0] ?? join(homedir(),'Weydub-Trial'));
if (!args.length) {
  try { await mkdir(dir,{mode:0o700}); }
  catch(e) { if (e.code!=='EEXIST') throw e; }
}
await checkFolder(dir);
await startServer(dir);
