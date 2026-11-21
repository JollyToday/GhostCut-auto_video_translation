import {copyFile, mkdir} from 'node:fs/promises';

for (const file of ['nodes/Weydub/weydub.svg']) {
  const src=new URL(file,import.meta.url), dest=new URL(`dist/${file}`,import.meta.url);
  await mkdir(new URL('./',dest),{recursive:true});
  await copyFile(src,dest);
}
