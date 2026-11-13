// Downloads the chosen Commons files (1200 px wide) and saves them as JPEG named after the idol.
// usage: node pick.mjs candidates.json picks.json outDir   (picks: { "GROUP__Name": candidateNumber })
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
const require = createRequire("C:/Users/danim/Project/sabung-idol/node_modules/.pnpm/sharp@0.35.5_@types+node@26.6.6/node_modules/sharp/package.json");
const sharp = require("sharp");
const [, , candFile, pickFile, out] = process.argv;
const cands = JSON.parse(readFileSync(candFile, "utf8"));
const picks = JSON.parse(readFileSync(pickFile, "utf8"));
const UA = { "User-Agent": "SabungIdolPhotoPicker/1.0 (personal non-commercial fan app)" };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });
for (const [key, n] of Object.entries(picks)) {
  const title = cands[key][n - 1];
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.slice(5).replace(/ /g, "_"))}?width=1200`, { headers: UA });
    if (res.status === 429 || res.status === 503) { await wait(15000 * (i + 1)); continue; }
    const name = key.split("__")[1];
    await sharp(Buffer.from(await res.arrayBuffer())).jpeg({ quality: 90 }).toFile(`${out}/${name}.jpg`);
    console.log(name, "<-", title);
    break;
  }
  await wait(2000);
}
