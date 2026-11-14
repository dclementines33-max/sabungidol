// Integrity check in the Worker (PRD §14.2): the database's own list plus the photo files in OPFS,
// and the one-button fixes. Only safe fixes run here; the others open the screen that fixes them.
import { type Db, type Issue, type IssueFix, checkIntegrity, forgetPhotos, photos, removeOrphanMatches } from "@sabung/db";

async function photoFolders(database: string) {
  const base = await (await navigator.storage.getDirectory()).getDirectoryHandle(`${database}-photos`, { create: true });
  const withFiles = new Set<string>();
  const all: string[] = [];
  for await (const [name, handle] of base.entries()) {
    if (handle.kind !== "directory") continue;
    all.push(name);
    for await (const _ of (handle as FileSystemDirectoryHandle).entries()) { withFiles.add(name); break; }
  }
  return { base, all, withFiles };
}

async function photoState(db: Db, database: string) {
  const records = (await db.select({ id: photos.id }).from(photos)).map((r) => r.id);
  const { base, all, withFiles } = await photoFolders(database);
  const known = new Set(records);
  return { base, missing: records.filter((id) => !withFiles.has(id)), orphans: all.filter((id) => !known.has(id)) };
}

export async function integrityCheck(db: Db, database: string): Promise<Issue[]> {
  const issues = await checkIntegrity(db);
  const { missing, orphans } = await photoState(db, database);
  if (missing.length) issues.push({ code: "W-INT-005", level: "warning", count: missing.length, fix: "remove-missing-photos", message: `${missing.length} photos are listed but their files are missing (those idols show initials)` });
  if (orphans.length) issues.push({ code: "W-INT-006", level: "warning", count: orphans.length, fix: "remove-orphan-photo-files", message: `${orphans.length} photo folders aren't used by anyone` });
  return issues;
}

export async function fixIntegrity(db: Db, database: string, fix: IssueFix) {
  if (fix === "remove-orphan-matches") await removeOrphanMatches(db);
  if (fix === "remove-missing-photos") await forgetPhotos(db, (await photoState(db, database)).missing);
  if (fix === "remove-orphan-photo-files") {
    const { base, orphans } = await photoState(db, database);
    for (const id of orphans) await base.removeEntry(id, { recursive: true });
  }
}
