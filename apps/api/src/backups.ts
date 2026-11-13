// Cloud backups (PRD §12.4): list, upload, download and delete the logged-in user's .sabung files.
// Every query is filtered on userId: one user never sees another's backups.
import { and, desc, eq } from "drizzle-orm";
import type { Db } from "./db";
import type { Files } from "./files";
import { cloudBackup } from "./schema";

export const MAX_BACKUP_BYTES = 90 * 1024 * 1024; // under Cloudflare's 100 MB request limit

const path = (userId: string, id: string) => `${userId}/${id}.sabung`;

export const listBackups = (db: Db, userId: string) =>
  db.select({ id: cloudBackup.id, name: cloudBackup.name, size: cloudBackup.size, createdAt: cloudBackup.createdAt })
    .from(cloudBackup).where(eq(cloudBackup.userId, userId)).orderBy(desc(cloudBackup.createdAt));

export async function uploadBackup(db: Db, files: Files, userId: string, name: string, body: ArrayBuffer) {
  const id = crypto.randomUUID();
  await files.put(path(userId, id), body); // the file first: a row never points at a missing file
  await db.insert(cloudBackup).values({ id, userId, name, size: body.byteLength });
  return id;
}

async function own(db: Db, userId: string, id: string) {
  const [row] = await db.select().from(cloudBackup).where(and(eq(cloudBackup.id, id), eq(cloudBackup.userId, userId)));
  return row;
}

export async function downloadBackup(db: Db, files: Files, userId: string, id: string) {
  const row = await own(db, userId, id);
  const body = row && (await files.get(path(userId, id)));
  return row && body ? { name: row.name, body } : null;
}

export async function deleteBackup(db: Db, files: Files, userId: string, id: string) {
  if (!(await own(db, userId, id))) return false;
  await db.delete(cloudBackup).where(eq(cloudBackup.id, id));
  await files.remove(path(userId, id));
  return true;
}
