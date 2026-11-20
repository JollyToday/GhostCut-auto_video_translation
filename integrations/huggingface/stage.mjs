import { copyFile, mkdir, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

if (!process.argv[2]) throw Error("Pass a new or empty output directory.");
const out = resolve(process.argv[2]);
await mkdir(out, { recursive: true });
if ((await readdir(out)).length) throw Error("Use an empty directory.");
for (const file of ["README.md", "app.py", "requirements.txt", "example.srt", "gallery.py", "theme.css", "label-zh.webp", "label-en.webp"]) {
  await copyFile(new URL(file, import.meta.url), join(out, file));
}
for (const file of ["nodes.py", "contract.json"]) {
  await copyFile(new URL(`../comfy/${file}`, import.meta.url), join(out, file));
}
console.log(`Staged the public Space in ${out}`);
