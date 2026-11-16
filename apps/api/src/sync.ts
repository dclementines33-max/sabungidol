// Cloud sync routes (2026-11-16), for the logged-in user only:
//   GET  /api/sync?since=<seq>         records written after that seq (a page; `more` = ask again)
//   POST /api/sync  { rows }            upsert; a record only changes when the incoming updatedAt is newer (last write
//                                       wins); gallery entries are add-only. Nothing is ever deleted (user decision).
//   POST /api/sync/photos/missing { hashes }   which originals are not in Storage yet
//   PUT  /api/sync/photos/<sha256>     upload a photo: its 1024 copy (or its original when smaller), named by the original's SHA-256
//   GET  /api/sync/photos/<sha256>     download it
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Db } from "./db";
import type { Files } from "./files";
import { syncFile, syncRecord } from "./schema";

export const KINDS = ["group", "idol", "gallery", "photo", "league", "roster"] as const;
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const PAGE = 1000;
const HASH = /^[0-9a-f]{64}$/;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/; // toISOString(): compares correctly as text

type Row = { kind: string; key: string; data: unknown; updatedAt: string };
const valid = (r: Row) => KINDS.includes(r.kind as never) && typeof r.key === "string" && r.key.length > 0 && r.key.length <= 300
  && ISO.test(r.updatedAt) && r.data !== null && typeof r.data === "object";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const error = (status: number, message: string) => json({ error: message }, status);
const path = (userId: string, hash: string) => `sync/${userId}/${hash}`;

export async function pushRows(db: Db, userId: string, rows: Row[]) {
  for (const r of rows) {
    const insert = db.insert(syncRecord).values({ userId, kind: r.kind, key: r.key, data: r.data, updatedAt: r.updatedAt });
    if (r.kind === "gallery") await insert.onConflictDoNothing(); // add-only: a re-sent entry never comes back to other devices
    else await insert.onConflictDoUpdate({
      target: [syncRecord.userId, syncRecord.kind, syncRecord.key],
      set: { data: r.data, updatedAt: r.updatedAt, seq: sql`nextval(pg_get_serial_sequence('sync_record', 'seq'))` },
      setWhere: sql`${syncRecord.updatedAt} < ${r.updatedAt}`,
    });
  }
}

export async function pullRows(db: Db, userId: string, since: number) {
  const rows = await db.select({ kind: syncRecord.kind, key: syncRecord.key, data: syncRecord.data, updatedAt: syncRecord.updatedAt, seq: syncRecord.seq })
    .from(syncRecord).where(and(eq(syncRecord.userId, userId), gt(syncRecord.seq, since))).orderBy(asc(syncRecord.seq)).limit(PAGE);
  return { rows, seq: rows.at(-1)?.seq ?? since, more: rows.length === PAGE };
}

export async function handleSync(request: Request, db: Db, files: Files, userId: string): Promise<Response> {
  const url = new URL(request.url);
  const [, , , part, hash] = url.pathname.split("/"); // /api/sync[/photos/<hash>|/photos/missing]
  if (!part && request.method === "GET") return json(await pullRows(db, userId, Number(url.searchParams.get("since")) || 0));
  if (!part && request.method === "POST") {
    const body = (await request.json().catch(() => null)) as { rows?: Row[] } | null;
    const rows = body?.rows;
    if (!Array.isArray(rows) || rows.length > PAGE || !rows.every(valid)) return error(400, "Bad sync rows.");
    await pushRows(db, userId, rows);
    return json({ ok: true });
  }
  if (part !== "photos") return error(404, "Not found");
  if (hash === "missing" && request.method === "POST") {
    const hashes = ((await request.json().catch(() => null)) as { hashes?: string[] } | null)?.hashes;
    if (!Array.isArray(hashes) || hashes.length > PAGE || !hashes.every((h) => HASH.test(h))) return error(400, "Bad hashes.");
    const have = hashes.length ? new Set((await db.select({ hash: syncFile.hash }).from(syncFile).where(and(eq(syncFile.userId, userId), inArray(syncFile.hash, hashes)))).map((r) => r.hash)) : new Set();
    return json({ missing: hashes.filter((h) => !have.has(h)) });
  }
  if (!hash || !HASH.test(hash)) return error(400, "Bad photo hash.");
  if (request.method === "PUT") {
    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_PHOTO_BYTES) return error(413, "The photo is empty or over 20 MB.");
    await files.put(path(userId, hash), body); // the file first: a row never points at a missing file
    await db.insert(syncFile).values({ userId, hash, size: body.byteLength }).onConflictDoNothing();
    return json({ ok: true }, 201);
  }
  if (request.method === "GET") {
    const body = await files.get(path(userId, hash));
    return body ? new Response(body, { headers: { "content-type": "application/octet-stream", "cache-control": "private, max-age=31536000, immutable" } }) : error(404, "Photo not found.");
  }
  return error(405, "Method not allowed");
}
