// Cloud backups (PRD §12.4): list, upload, download and delete the logged-in user's .sabung files.
// Every query is filtered on userId: one user never sees another's backups.
import { and, desc, eq } from "drizzle-orm";
import type { Db } from "./db";
import type { Files } from "./files";
import { cloudBackup } from "./schema";

export const MAX_BACKUP_BYTES = 90 * 1024 * 1024; // under Cloudflare's 100 MB request limit

const path = (userId: string, id: string) => `${userId}/${id}.sabung`;

// Big backups (2026-11-16): Supabase rejects objects over 50 MB and a Worker should not hold 90 MB, so the app sends a
// backup in parts of at most 25 MB, each its own object, then records it once all are up. The part count rides in the
// id ("<upload>.<parts>"): no new column, old single-file backups (plain uuid) keep working.
export const MAX_PART_BYTES = 25 * 1024 * 1024;
export const MAX_PARTS = 40;
export const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const partPath = (userId: string, upload: string, i: number) => `${userId}/${upload}.part${i}`;
const split = (id: string) => { const m = /^(.+)\.(\d+)$/.exec(id); return m ? { upload: m[1]!, parts: Number(m[2]) } : null; };

export const uploadPart = (files: Files, userId: string, upload: string, i: number, body: ArrayBuffer) => files.put(partPath(userId, upload, i), body);

// shortcut: trusts the client that parts 0..parts-1 are up (checking would mean downloading them); a missing one fails the download.
export async function finishUpload(db: Db, userId: string, upload: string, name: string, parts: number, size: number) {
  const id = `${upload}.${parts}`;
  await db.insert(cloudBackup).values({ id, userId, name, size });
  return id;
}

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
  if (!row) return null;
  const multi = split(id);
  if (multi) { // the parts in order, streamed: never the whole file in memory
    let i = 0;
    const body = new ReadableStream<Uint8Array>({
      async pull(out) {
        if (i === multi.parts) return out.close();
        const part = await files.get(partPath(userId, multi.upload, i++));
        if (!part) return out.error(new Error(`Backup part ${i - 1} is missing`));
        out.enqueue(new Uint8Array(part));
      },
    });
    return { name: row.name, body, size: row.size };
  }
  const body = await files.get(path(userId, id));
  return body ? { name: row.name, body, size: row.size } : null;
}

export async function deleteBackup(db: Db, files: Files, userId: string, id: string) {
  if (!(await own(db, userId, id))) return false;
  await db.delete(cloudBackup).where(eq(cloudBackup.id, id));
  const multi = split(id);
  if (multi) for (let i = 0; i < multi.parts; i++) await files.remove(partPath(userId, multi.upload, i));
  else await files.remove(path(userId, id));
  return true;
}
