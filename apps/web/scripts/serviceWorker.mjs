// PWA (PRD §11): after `vite build`, Workbox writes dist/client/sw.js, which caches the whole app
// (pages, PGlite WASM, the default idol data) so it opens and runs fully offline.
// shortcut: no skipWaiting, so a new version takes over only after every tab is closed; add an
// "update ready" notice if users stay on old versions too long.
import { generateSW } from "workbox-build";

const { count, size, warnings } = await generateSW({
  globDirectory: "dist/client",
  globPatterns: ["**/*.{html,js,css,wasm,data,json,woff2,svg,webmanifest}"],
  swDest: "dist/client/sw.js",
  navigateFallback: "/index.html", // every route is the same SPA shell
  maximumFileSizeToCacheInBytes: 12 * 1024 * 1024, // pglite.wasm is ~9 MB
  cleanupOutdatedCaches: true,
});
for (const warning of warnings) console.warn(warning);
console.log(`sw.js: ${count} files, ${(size / 1048576).toFixed(1)} MB precached`);
