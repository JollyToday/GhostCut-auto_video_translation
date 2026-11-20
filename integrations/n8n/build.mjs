import {copyFile, mkdir} from 'node:fs/promises';

for (const file of ['contract.json', 'nodes/Weydub.node.js', 'nodes/weydub.svg', 'credentials/WeydubApi.credentials.js']) {
  const src=new URL(file,import.meta.url), dest=new URL(`dist/${file}`,import.meta.url);
  await mkdir(new URL('./',dest),{recursive:true});
  await copyFile(src,dest);
}
