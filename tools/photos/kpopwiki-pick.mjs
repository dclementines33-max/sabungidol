// Saves the chosen K-pop Wiki photos as JPEG (max 1200 px wide), named after the idol, one folder per group.
// usage: node fd-pick.mjs picks.json outDir candidates.json...   picks: { "GROUP__Name": n | [n, keepTopShare] }
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
const require = createRequire("C:/Users/danim/Project/sabung-idol/node_modules/.pnpm/sharp@0.35.5_@types+node@26.6.6/node_modules/sharp/package.json");
const sharp = require("sharp");
const [, , pickFile, out, ...candFiles] = process.argv;
const cands = Object.assign({}, ...candFiles.map((f) => JSON.parse(readFileSync(f, "utf8"))));
const UA = { "User-Agent": "SabungIdolPhotoPicker/1.0 (personal non-commercial fan app)" };
for (const [key, pick] of Object.entries(JSON.parse(readFileSync(pickFile, "utf8")))) {
  const [n, top = 1] = Array.isArray(pick) ? pick : [pick];
  const c = cands[key][n - 1];
  const [group, name] = key.split("__");
  mkdirSync(`${out}/${group}`, { recursive: true });
  let img = sharp(Buffer.from(await (await fetch(c.url, { headers: UA })).arrayBuffer()));
  if (top < 1) { const m = await img.metadata(); img = sharp(await img.extract({ left: 0, top: 0, width: m.width, height: Math.round(m.height * top) }).toBuffer()); }
  await img.resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(`${out}/${group}/${name}.jpg`);
  console.log(key, "<-", c.title);
  await new Promise((r) => setTimeout(r, 400));
}
