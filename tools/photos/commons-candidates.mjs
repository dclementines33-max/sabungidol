// Finds candidate photos on Wikimedia Commons per idol and builds a numbered contact sheet to choose from.
// usage: node cands.mjs list.json outDir   (list: [{ key, query, n? }])
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const require = createRequire("C:/Users/danim/Project/sabung-idol/node_modules/.pnpm/sharp@0.35.5_@types+node@26.6.6/node_modules/sharp/package.json");
const sharp = require("sharp");
const [, , listFile, out] = process.argv;
const UA = { "User-Agent": "SabungIdolPhotoPicker/1.0 (personal non-commercial fan app)" };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, kind = "json") {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.status === 429 || res.status === 503) { await wait(15000 * (i + 1)); continue; }
    const body = kind === "json" ? await res.text() : Buffer.from(await res.arrayBuffer());
    if (kind === "json" && body.startsWith("You are making")) { await wait(15000 * (i + 1)); continue; }
    return kind === "json" ? JSON.parse(body) : body;
  }
  throw new Error("rate limited: " + url);
}
const list = JSON.parse(readFileSync(listFile, "utf8"));
const result = {};
for (const { key, query, n = 8 } of list) {
  const s = await get(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=${n * 2}&format=json&srsearch=${encodeURIComponent(query)}`);
  const titles = s.query.search.map((r) => r.title).filter((t) => /\.(jpe?g|png|webp)$/i.test(t)).slice(0, n);
  await wait(2500);
  const tiles = [];
  const kept = [];
  for (const t of titles) {
    try {
      const buf = await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(t.slice(5).replace(/ /g, "_"))}?width=330`, "bin");
      const img = await sharp(buf).resize(300, 400, { fit: "cover", position: "attention" }).jpeg().toBuffer();
      const label = Buffer.from(`<svg width="300" height="400"><rect width="44" height="34" fill="black"/><text x="8" y="26" font-size="26" fill="yellow" font-family="Arial">${kept.length + 1}</text></svg>`);
      tiles.push(await sharp(img).composite([{ input: label, top: 0, left: 0 }]).toBuffer());
      kept.push(t);
    } catch { /* skip */ }
    await wait(1500);
  }
  result[key] = kept;
  if (tiles.length) {
    const cols = 4, rows = Math.ceil(tiles.length / cols);
    const sheet = sharp({ create: { width: cols * 300, height: rows * 400, channels: 3, background: "#222" } })
      .composite(tiles.map((input, i) => ({ input, left: (i % cols) * 300, top: Math.floor(i / cols) * 400 })));
    mkdirSync(out, { recursive: true });
    await sheet.jpeg({ quality: 80 }).toFile(`${out}/${key}.jpg`);
  }
  writeFileSync(`${out}/candidates.json`, JSON.stringify(result, null, 1));
  console.log(key, kept.length);
}
