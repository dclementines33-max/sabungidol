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
    throw new Error("This isn't a .sabung backup (not a valid ZIP).");
  }
  let manifest: Manifest | undefined;
  try {
    manifest = JSON.parse(strFromU8(files["manifest.json"] ?? new Uint8Array())) as Manifest;
  } catch {
    manifest = undefined; // a broken manifest is "not a backup", not a raw SyntaxError
  }
  if (!manifest || manifest.app !== "sabung-idol" || !manifest.tables) throw new Error("This isn't a Sabung Idol backup (no manifest.json).");
  if (manifest.schemaVersion > schemaVersion || manifest.format > FORMAT) {
    throw new Error(`This backup comes from a newer app version (schema ${manifest.schemaVersion}, here ${schemaVersion}). Update the app first.`);
  }
  let tables: BackupTables = {};
  for (const [name, { rows, sha256: expected }] of Object.entries(manifest.tables)) {
    const file = files[`data/${name}.ndjson`];
    if (!file || (await sha256(file)) !== expected) throw new Error(`Backup damaged: ${name} doesn't match its checksum.`);
    const text = strFromU8(file);
    tables[name] = text ? text.split("\n").map((line) => JSON.parse(line)) : [];
    if (tables[name]!.length !== rows) throw new Error(`Backup damaged: ${name} has ${tables[name]!.length} rows, the manifest says ${rows}.`);
  }
  for (let v = manifest.schemaVersion; v < schemaVersion; v++) tables = UPGRADES[v]?.(tables) ?? tables;
  const photos = Object.fromEntries(Object.entries(files).filter(([p]) => p.startsWith("photos/") && !p.endsWith("/")).map(([p, b]) => [p.slice(7), b]));
  return { manifest, tables, photos };
}
