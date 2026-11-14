// Backup and restore in the Worker (PRD §12.3): export a section with its photo files, preview and
// apply an import, keep the 3 latest automatic snapshots, and know when the last backup was made.
import { type Db, type ImportMode, bundledMigrations, eventLog, importBackup, lastEventAt, readBackupTables } from "@sabung/db";
import { type BackupSection, SECTION_LABELS } from "@sabung/shared";
import { writeFile } from "../photoFiles";
import { type PhotoFiles, readSabung, writeSabung } from "./sabungFile";

export const BACKUP_DONE = "I-BACKUP-001";
const KEEP_SNAPSHOTS = 3;
const schemaVersion = async () => (await bundledMigrations()).length;
const root = () => navigator.storage.getDirectory();

async function readPhotos(database: string, photoIds: string[]): Promise<PhotoFiles> {
  const files: PhotoFiles = {};
  const base = await (await root()).getDirectoryHandle(`${database}-photos`, { create: true });
  for (const id of photoIds) {
    const dir = await base.getDirectoryHandle(id).catch(() => null);
    if (!dir) continue; // a record without files: the integrity check reports it
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === "file") files[`${id}/${name}`] = new Uint8Array(await (await (handle as FileSystemFileHandle).getFile()).arrayBuffer());
    }
  }
  return files;
}

export async function exportBackup(db: Db, database: string, section: BackupSection, seasonId?: string, log = true) {
  const tables = await readBackupTables(db, section, seasonId);
  const photos = tables.photos ? await readPhotos(database, tables.photos.map((p) => p.id as string)) : {};
  const { bytes, manifest } = await writeSabung(section, tables, photos, await schemaVersion());
  if (log) await db.insert(eventLog).values({ level: "success", code: BACKUP_DONE, message: `Backup ${SECTION_LABELS[section]} created` });
  return { bytes, name: `sabung-${section}-${manifest.createdAt.slice(0, 10)}.sabung` };
}

// What an import would do (nothing is written), or does it. Replace first saves a snapshot.
export async function importSabung(db: Db, database: string, bytes: Uint8Array, mode: ImportMode, dryRun: boolean) {
  const { manifest, tables, photos } = await readSabung(bytes, await schemaVersion());
  if (!dryRun && mode === "replace") await saveSnapshot(db, database, "import Replace");
  const result = await importBackup(db, tables, mode, dryRun);
  if (!dryRun) {
    const base = await (await root()).getDirectoryHandle(`${database}-photos`, { create: true });
    for (const [path, data] of Object.entries(photos)) {
      const [id, name] = path.split("/") as [string, string];
      await writeFile(await base.getDirectoryHandle(id, { create: true }), name, new Blob([data as BlobPart]));
    }
  }
  return { ...result, section: manifest.section, createdAt: manifest.createdAt };
}

// Auto-snapshot before a dangerous action (PRD §12.3): a full backup kept in OPFS, 3 latest only.
export async function saveSnapshot(db: Db, database: string, reason: string) {
  const { bytes } = await exportBackup(db, database, "full", undefined, false);
  const dir = await (await root()).getDirectoryHandle(`${database}-snapshots`, { create: true });
  await writeFile(dir, `${new Date().toISOString().replace(/[:.]/g, "-")} ${reason}.sabung`, new Blob([bytes as BlobPart]));
  const names = (await listSnapshots(database)).map((s) => s.name);
  for (const old of names.slice(KEEP_SNAPSHOTS)) await dir.removeEntry(old);
}

export async function listSnapshots(database: string) {
  const dir = await (await root()).getDirectoryHandle(`${database}-snapshots`, { create: true });
  const out: { name: string; bytes: number }[] = [];
  for await (const [name, handle] of dir.entries()) if (handle.kind === "file") out.push({ name, bytes: (await (handle as FileSystemFileHandle).getFile()).size });
  return out.sort((a, b) => b.name.localeCompare(a.name)); // newest first (names start with the time)
}

export async function readSnapshot(database: string, name: string) {
  const dir = await (await root()).getDirectoryHandle(`${database}-snapshots`);
  return new Uint8Array(await (await (await dir.getFileHandle(name)).getFile()).arrayBuffer());
}

// For the 7-day reminder: when the last backup was made (null = never).
export const lastBackupAt = (db: Db) => lastEventAt(db, BACKUP_DONE);

// PRD §12.3 reminder: due when the last backup — or, without one, the first load of data — is over 7 days old.
export async function backupDue(db: Db, now = Date.now()): Promise<boolean> {
  const since = (await lastBackupAt(db)) ?? (await lastEventAt(db, "I-SEED-001"));
  return !!since && now - Date.parse(since) > 7 * 24 * 3600 * 1000;
}
