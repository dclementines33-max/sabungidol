// Where the database lives (user decision, Fase 1 step 9): OPFS where the browser supports it,
// plain IndexedDB otherwise (safe but slow; the user is told). Chosen by what the browser CAN do,
// never by "try OPFS, else IndexedDB": a passing OPFS hiccup would then open an empty database.
export type StorageKind = "opfs" | "indexeddb";

export const MAIN_DATABASE = "sabung-idol"; // the app's own data; Fase 1 checks use separate names

// Safari / WebKit: has OPFS sync handles but caps how many can be open (~252), fewer than PGlite's
// opfs-ahp pool needs, so the first query fails (seen in the WebKit e2e, Fase 3 step 9). Chrome, Edge
// and other Chromium browsers say "Chrome"/"Chromium"/"Edg" in their user agent; Safari does not.
export const isSafari = (ua = typeof navigator === "undefined" ? "" : navigator.userAgent) =>
  /AppleWebKit/.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android/.test(ua);

// OPFS with synchronous access handles, which PGlite needs; only available inside a Worker.
export function supportsOpfs(): boolean {
  return !isSafari() && typeof FileSystemFileHandle !== "undefined"
    && "createSyncAccessHandle" in FileSystemFileHandle.prototype
    && typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function";
}

export function storageFor(name: string, opfs = supportsOpfs()): { dataDir: string; storage: StorageKind } {
  return opfs ? { dataDir: `opfs-ahp://${name}`, storage: "opfs" } : { dataDir: `idb://${name}`, storage: "indexeddb" };
}

export const SLOW_STORAGE_NOTICE =
  "Browser ini tidak mendukung penyimpanan cepat (OPFS), jadi data disimpan di IndexedDB. Data tetap aman, tapi menyimpan satu season bisa butuh belasan detik.";
