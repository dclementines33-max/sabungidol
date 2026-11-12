// Performance budget (PRD §13): the JavaScript the first page loads must stay under 180 KB gzip.
// Counts every script the built shell page references (entry + preloads), not the lazy Worker.
// Run after `vite build`: node scripts/checkBundle.mjs
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_BYTES = 180_000;
const client = new URL("../dist/client/", import.meta.url);
const shell = readFileSync(new URL("_shell.html", client), "utf8");
const scripts = [...new Set([...shell.matchAll(/["'](\/assets\/[^"']+\.js)["']/g)].map((m) => m[1]))];
if (scripts.length === 0) throw new Error("No scripts found in dist/client/_shell.html — run vite build first");

let total = 0;
for (const path of scripts) {
  const size = gzipSync(readFileSync(new URL(`.${path}`, client))).length;
  total += size;
  console.log(`${(size / 1000).toFixed(1).padStart(7)} KB  ${path}`);
}
console.log(`${(total / 1000).toFixed(1).padStart(7)} KB  initial JS (gzip), budget ${BUDGET_BYTES / 1000} KB`);
if (total > BUDGET_BYTES) {
  console.error("Over budget");
  process.exit(1);
}
