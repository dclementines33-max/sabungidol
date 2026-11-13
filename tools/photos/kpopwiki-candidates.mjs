// Candidate photos from the K-pop Wiki (kpop.fandom.com): the member's page and its /Gallery, images whose file name
// has the member's name, up to 12, as a numbered contact sheet. usage: node fandom.mjs list.json outDir
// list: [{ key: "GROUP__Name", page: "Mayu (tripleS)", match: "Mayu" }]
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const require = createRequire("C:/Users/danim/Project/sabung-idol/node_modules/.pnpm/sharp@0.35.5_@types+node@26.6.6/node_modules/sharp/package.json");
const sharp = require("sharp");
const [, , listFile, out] = process.argv;
const API = "https://kpop.fandom.com/api.php?format=json&";
const UA = { "User-Agent": "SabungIdolPhotoPicker/1.0 (personal non-commercial fan app)" };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const json = async (q) => (await fetch(API + q, { headers: UA })).json();
const list = JSON.parse(readFileSync(listFile, "utf8"));
mkdirSync(out, { recursive: true });
const result = {};
for (const item of list) {
  const { key, match } = item;
  let page = item.page;
  if (!page) { // the wiki page of this member: search "<name> <group>", first hit
    const r = await json(`action=query&list=search&srlimit=1&srsearch=${encodeURIComponent(item.query)}`);
    page = r.query?.search?.[0]?.title ?? item.query;
    await wait(800);
  }
  const files = [];
  for (const p of [page, `${page}/Gallery`]) {
    let cont = "";
    for (let i = 0; i < 5; i++) {
      const r = await json(`action=query&prop=images&imlimit=500&redirects=1&titles=${encodeURIComponent(p)}${cont}`);
      for (const pg of Object.values(r.query?.pages ?? {})) for (const im of pg.images ?? []) files.push(im.title);
      if (!r.continue) break;
      cont = `&imcontinue=${encodeURIComponent(r.continue.imcontinue)}`;
    }
    await wait(800);
  }
  const words = match.toLowerCase().split(/\s+/);
  const picked = [...new Set(files)].filter((t) => /\.(png|jpe?g|webp)$/i.test(t) && words.every((w) => t.toLowerCase().includes(w)) && !/logo|album|cover|signature/i.test(t)).reverse().slice(0, 12);
  const urls = [];
  for (let i = 0; i < picked.length; i += 12) {
    const r = await json(`action=query&prop=imageinfo&iiprop=url&iiurlwidth=330&titles=${encodeURIComponent(picked.slice(i, i + 12).join("|"))}`);
    const byTitle = new Map(Object.values(r.query.pages).map((pg) => [pg.title, pg.imageinfo?.[0]]));
    for (const t of picked.slice(i, i + 12)) if (byTitle.get(t)) urls.push({ title: t, thumb: byTitle.get(t).thumburl, url: byTitle.get(t).url });
  }
  const tiles = [];
  const kept = [];
  for (const u of urls) {
    try {
      const buf = Buffer.from(await (await fetch(u.thumb, { headers: UA })).arrayBuffer());
      const img = await sharp(buf).resize(300, 400, { fit: "cover", position: "attention" }).jpeg().toBuffer();
      const label = Buffer.from(`<svg width="300" height="400"><rect width="44" height="34" fill="black"/><text x="8" y="26" font-size="26" fill="yellow" font-family="Arial">${kept.length + 1}</text></svg>`);
      tiles.push(await sharp(img).composite([{ input: label, top: 0, left: 0 }]).toBuffer());
      kept.push(u);
    } catch { /* skip */ }
  }
  result[key] = kept;
  if (tiles.length) {
    const cols = 4, rows = Math.ceil(tiles.length / cols);
    await sharp({ create: { width: cols * 300, height: rows * 400, channels: 3, background: "#222" } })
      .composite(tiles.map((input, i) => ({ input, left: (i % cols) * 300, top: Math.floor(i / cols) * 400 }))).jpeg({ quality: 80 }).toFile(`${out}/${key}.jpg`);
  }
  writeFileSync(`${out}/candidates.json`, JSON.stringify(result, null, 1));
  console.log(key, "|", page, files.length, kept.length);
}
