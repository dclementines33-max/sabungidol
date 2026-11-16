// Cloud sync in the Worker (2026-11-16): when signed in, push what changed here since the last push (photo originals
// first, so a record never points at a missing photo), then pull what other devices wrote and merge it (packages/db
// sync.ts). Offline or signed out it does nothing; unsent changes simply go next time (lastPush only moves on success).
import { type Db, applyRemote, currentSeason, insertPhoto, localChanges, photoByHash, photosWithoutHash, readCache, setPhotoHash, writeCache } from "@sabung/db";
import type { SyncRow } from "@sabung/db";
import { defaultLeagueName } from "../components/competition/arenaTheme";
import { readPhotoFile, removePhotoFiles, storePhotoFiles } from "./photoFiles";
import type { PhotoSizes } from "./photoSizes";

const KEY = "cloud-sync";
const CHUNK = 1000;
type State = { lastPush: string | null; seq: number };

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
export const sha256 = async (data: ArrayBuffer) => hex(await crypto.subtle.digest("SHA-256", data));
async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/${path}`, init);
  if (!res.ok) throw new Error(`Sync ${path}: HTTP ${res.status}`);
  return res;
}
const post = (path: string, body: unknown) => api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const hashesOf = (r: SyncRow) => [r.kind === "photo" ? r.key : r.kind === "gallery" ? r.data.hash : r.kind === "idol" ? r.data.photo : r.data.logo].filter((h): h is string => typeof h === "string" && !!h);

async function original(db: Db, database: string, hash: string) {
  const id = await photoByHash(db, hash);
  return id ? readPhotoFile(database, id, "orig", {} as PhotoSizes) : null;
}

// The local photo for a cloud hash; a new one is downloaded and stored (files removed again if its record fails).
async function localPhoto(db: Db, database: string, hash: string) {
  const known = await photoByHash(db, hash);
  if (known) return known;
  const stored = await storePhotoFiles(database, new Blob([await (await api(`sync/photos/${hash}`)).arrayBuffer()]));
  try {
    await insertPhoto(db, { ...stored, hash });
  } catch (error) {
    await removePhotoFiles(database, stored.id).catch(() => {});
    throw error;
  }
  return stored.id;
}

let running: Promise<{ pushed: number; pulled: number }> | null = null;
export const syncNow = (db: Db, database: string) => (running ??= run(db, database).finally(() => { running = null; }));

async function run(db: Db, database: string) {
  const session = await fetch("/api/auth/get-session").then((r) => (r.ok ? r.json() : null)).catch(() => null) as { user?: unknown } | null;
  if (!session?.user) return { pushed: 0, pulled: 0 };
  for (const p of await photosWithoutHash(db)) { // photos from before sync: hashed once
    const blob = await readPhotoFile(database, p.id, "orig", p.sizes as PhotoSizes).catch(() => null);
    if (blob) await setPhotoHash(db, p.id, await sha256(await blob.arrayBuffer()));
  }
  const state = (await readCache<State>(db, KEY)) ?? { lastPush: null, seq: 0 };
  const startedAt = new Date().toISOString();
  const season = await currentSeason(db);
  const rows = await localChanges(db, state.lastPush, season?.id ?? null);
  const hashes = [...new Set(rows.flatMap(hashesOf))];
  for (let i = 0; i < hashes.length; i += CHUNK) {
    const { missing } = (await (await post("sync/photos/missing", { hashes: hashes.slice(i, i + CHUNK) })).json()) as { missing: string[] };
    for (const hash of missing) {
      const blob = await original(db, database, hash);
      if (blob) await api(`sync/photos/${hash}`, { method: "PUT", body: blob });
    }
  }
  for (let i = 0; i < rows.length; i += CHUNK) await post("sync", { rows: rows.slice(i, i + CHUNK) });
  await writeCache(db, KEY, "sync", { ...state, lastPush: startedAt }, 0);

  let seq = state.seq;
  const pulled: SyncRow[] = [];
  for (;;) {
    const page = (await (await api(`sync?since=${seq}`)).json()) as { rows: SyncRow[]; seq: number; more: boolean };
    pulled.push(...page.rows);
    seq = page.seq;
    if (!page.more) break;
  }
  const changed = await applyRemote(db, pulled, { seasonId: season?.id ?? null, leagueName: (code) => defaultLeagueName(code[2]!), photoId: (h) => localPhoto(db, database, h) });
  await writeCache(db, KEY, "sync", { lastPush: startedAt, seq }, 0);
  return { pushed: rows.length, pulled: changed };
}
