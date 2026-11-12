// Where the database lives (user decision, Fase 1 step 9): OPFS where the browser supports it,
// plain IndexedDB otherwise (safe but slow; the user is told). Chosen by what the browser CAN do,
// never by "try OPFS, else IndexedDB": a passing OPFS hiccup would then open an empty database.
export type StorageKind = "opfs" | "indexeddb";

// OPFS with synchronous access handles, which PGlite needs; only available inside a Worker.
export function supportsOpfs(): boolean {
  return typeof FileSystemFileHandle !== "undefined"
    && "createSyncAccessHandle" in FileSystemFileHandle.prototype
    && typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function";
}

export function storageFor(name: string, opfs = supportsOpfs()): { dataDir: string; storage: StorageKind } {
  return opfs ? { dataDir: `opfs-ahp://${name}`, storage: "opfs" } : { dataDir: `idb://${name}`, storage: "indexeddb" };
}

export const SLOW_STORAGE_NOTICE =
  "Browser ini tidak mendukung penyimpanan cepat (OPFS), jadi data disimpan di IndexedDB. Data tetap aman, tapi menyimpan satu season bisa butuh belasan detik.";
