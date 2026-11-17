// Tiny static server for the marble match preview (no install needed): serves this folder, plus the idol photos in
// ../../import/ive-photos at /photos/<file> and their list at /photos.json. Run: node server.mjs  → http://localhost:5191
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const photos = join(root, "../../import/ive-photos");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".json": "application/json" };
const PORT = Number(process.env.PORT ?? 5191);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    if (path === "/photos.json") {
      const files = (await readdir(photos).catch(() => [])).filter((f) => f.endsWith(".jpg"));
      return res.writeHead(200, { "content-type": TYPES[".json"] }).end(JSON.stringify(files));
    }
    const base = path.startsWith("/photos/") ? photos : root;
    const rel = path.startsWith("/photos/") ? path.slice(8) : path === "/" ? "index.html" : path.slice(1);
    const file = normalize(join(base, rel));
    if (!file.startsWith(normalize(base))) throw new Error("outside");
    const body = await readFile(file); // read first: a missing file must not have sent a 200 already
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => console.log(`marble match preview on http://localhost:${PORT}`));
