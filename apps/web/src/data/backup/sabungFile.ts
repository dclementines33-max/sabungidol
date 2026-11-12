// The .sabung file (PRD §12.3): a ZIP with manifest.json (schema version, date, rows and a SHA-256
// per table), data/<table>.ndjson and photos/<photoId>/<file>. Reading checks every checksum,
// refuses a backup from a newer app version and brings an older one up to date.
import type { BackupSection, BackupTables } from "@sabung/db";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export const FORMAT = 1;
export type Manifest = {
  app: "sabung-idol";
  format: number;
  schemaVersion: number;
  createdAt: string;
  section: BackupSection;
  tables: Record<string, { rows: number; sha256: string }>;
  photos: number;
};
export type PhotoFiles = Record<string, Uint8Array>; // "<photoId>/<file name>" → bytes

// Older backups are brought up to date one schema version at a time. None needed yet: the only
// migration so far (0001) added an index, which changes no rows.
const UPGRADES: Record<number, (tables: BackupTables) => BackupTables> = {};

const sha256 = async (bytes: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource))].map((b) => b.toString(16).padStart(2, "0")).join("");
const ndjson = (rows: unknown[]) => strToU8(rows.map((r) => JSON.stringify(r)).join("\n"));

export async function writeSabung(section: BackupSection, tables: BackupTables, photos: PhotoFiles, schemaVersion: number, now = new Date()): Promise<{ bytes: Uint8Array; manifest: Manifest }> {
  const files: Record<string, Uint8Array> = {};
  const manifest: Manifest = { app: "sabung-idol", format: FORMAT, schemaVersion, createdAt: now.toISOString(), section, tables: {}, photos: Object.keys(photos).length };
  for (const [name, rows] of Object.entries(tables)) {
    files[`data/${name}.ndjson`] = ndjson(rows);
    manifest.tables[name] = { rows: rows.length, sha256: await sha256(files[`data/${name}.ndjson`]!) };
  }
  for (const [path, bytes] of Object.entries(photos)) files[`photos/${path}`] = bytes;
  files["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  return { bytes: zipSync(files, { level: 6, mtime: now }), manifest };
}

export async function readSabung(bytes: Uint8Array, schemaVersion: number): Promise<{ manifest: Manifest; tables: BackupTables; photos: PhotoFiles }> {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("File ini bukan backup .sabung (bukan ZIP yang valid).");
  }
  const manifest = files["manifest.json"] && (JSON.parse(strFromU8(files["manifest.json"])) as Manifest);
  if (!manifest || manifest.app !== "sabung-idol") throw new Error("File ini bukan backup Sabung Idol (manifest.json tidak ada).");
  if (manifest.schemaVersion > schemaVersion || manifest.format > FORMAT) {
    throw new Error(`Backup ini dari versi aplikasi yang lebih baru (skema ${manifest.schemaVersion}, di sini ${schemaVersion}). Perbarui aplikasi dulu.`);
  }
  let tables: BackupTables = {};
  for (const [name, { rows, sha256: expected }] of Object.entries(manifest.tables)) {
    const file = files[`data/${name}.ndjson`];
    if (!file || (await sha256(file)) !== expected) throw new Error(`Backup rusak: data ${name} tidak cocok dengan checksum-nya.`);
    const text = strFromU8(file);
    tables[name] = text ? text.split("\n").map((line) => JSON.parse(line)) : [];
    if (tables[name]!.length !== rows) throw new Error(`Backup rusak: ${name} berisi ${tables[name]!.length} baris, manifest bilang ${rows}.`);
  }
  for (let v = manifest.schemaVersion; v < schemaVersion; v++) tables = UPGRADES[v]?.(tables) ?? tables;
  const photos = Object.fromEntries(Object.entries(files).filter(([p]) => p.startsWith("photos/") && !p.endsWith("/")).map(([p, b]) => [p.slice(7), b]));
  return { manifest, tables, photos };
}
