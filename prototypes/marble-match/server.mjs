// Tiny static server for the marble match preview (no install needed): serves this folder, plus the idol photos in
// ../../import/ive-photos and ../../import/new-photos/<group>/ at /photos/<path>, listed (with name and group) at
// /photos.json. Run: node server.mjs → http://localhost:5191
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)); // no trailing separator
const photos = normalize(join(root, "../../import"));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".json": "application/json" };
const PORT = Number(process.env.PORT ?? 5191);

async function photoList() {
  const out = [];
  const add = async (dir, group) => {
    for (const f of await readdir(join(photos, dir)).catch(() => [])) {
      if (f.endsWith(".jpg")) out.push({ file: `${dir}/${f}`, name: f.slice(0, -4).replace(new RegExp(` ${group}$`), ""), group });
    }
  };
  await add("ive-photos", "IVE");
  for (const g of await readdir(join(photos, "new-photos")).catch(() => [])) await add(`new-photos/${g}`, g);
  return out;
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    if (path === "/photos.json") return res.writeHead(200, { "content-type": TYPES[".json"] }).end(JSON.stringify(await photoList()));
    const fromPhotos = path.startsWith("/photos/");
    const base = fromPhotos ? photos : root;
    const file = normalize(join(base, fromPhotos ? path.slice(8) : path === "/" ? "index.html" : path.slice(1)));
    const top = file.slice(base.length + 1).split(sep)[0]; // photos: only from these two folders
    if (!file.startsWith(base + sep) || (fromPhotos && !["ive-photos", "new-photos"].includes(top))) throw new Error("outside");
    const body = await readFile(file); // read first: a missing file must not have sent a 200 already
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => console.log(`marble match preview on http://localhost:${PORT}`));
