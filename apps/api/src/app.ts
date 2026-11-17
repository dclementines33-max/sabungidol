// The API's routes: /api/auth/* goes to Better Auth, /api/backups/* and /api/sync/* (sync.ts) need a logged-in session.
import type { Auth } from "./auth";
import { MAX_BACKUP_BYTES, MAX_PARTS, MAX_PART_BYTES, UPLOAD_ID, deleteBackup, downloadBackup, finishUpload, listBackups, uploadBackup, uploadPart } from "./backups";
import type { Db } from "./db";
import type { Files } from "./files";
import { handleSync } from "./sync";

export type Deps = { db: Db; auth: Auth; files: Files };

const json = (body: unknown, status = 200) => Response.json(body, { status });
const error = (status: number, message: string) => json({ error: message }, status);

export async function handle(request: Request, { db, auth, files }: Deps): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/api/auth/")) return auth.handler(request);
  const sync = pathname === "/api/sync" || pathname.startsWith("/api/sync/");
  if (!sync && !pathname.startsWith("/api/backups")) return error(404, "Not found");

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return error(401, sync ? "Sign in to sync." : "Sign in to use cloud backup.");
  const userId = session.user.id;
  if (sync) return handleSync(request, db, files, userId);
  const [, , , id, upload, part] = pathname.split("/"); // /api/backups/:id, or /api/backups/upload/:upload[/:part]
  const query = new URL(request.url).searchParams;
  const name = query.get("name") ?? "";
  const named = /^[\w.-]{1,120}\.sabung$/.test(name);

  if (id === "upload") { // a big backup in parts (backups.ts)
    if (!upload || !UPLOAD_ID.test(upload)) return error(400, "Bad upload id.");
    if (part !== undefined && request.method === "PUT") {
      const i = Number(part);
      if (!part || !Number.isInteger(i) || i < 0 || i >= MAX_PARTS) return error(400, "Bad part number.");
      const body = await request.arrayBuffer();
      if (body.byteLength === 0 || body.byteLength > MAX_PART_BYTES) return error(413, "A part is empty or over 25 MB.");
      await uploadPart(files, userId, upload, i, body);
      return json({ ok: true }, 201);
    }
    if (part === undefined && request.method === "POST") {
      const parts = Number(query.get("parts"));
      const size = Number(query.get("size"));
      if (!named) return error(400, "The file name must end in .sabung.");
      if (!Number.isInteger(parts) || parts < 1 || parts > MAX_PARTS || !Number.isInteger(size) || size < 1 || size > parts * MAX_PART_BYTES) return error(400, "Bad parts or size.");
      return json({ id: await finishUpload(db, userId, upload, name, parts, size) }, 201);
    }
    return error(405, "Method not allowed");
  }

  if (!id && request.method === "GET") return json(await listBackups(db, userId));
  if (!id && request.method === "POST") { // one file (small backups and older app versions)
    if (!named) return error(400, "The file name must end in .sabung.");
    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_BACKUP_BYTES) return error(413, "The backup file is empty or over 90 MB.");
    return json({ id: await uploadBackup(db, files, userId, name, body) }, 201);
  }
  if (id && request.method === "GET") {
    const file = await downloadBackup(db, files, userId, id);
    return file
      ? new Response(file.body, { headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${file.name}"` } })
      : error(404, "Backup not found.");
  }
  if (id && request.method === "DELETE") return (await deleteBackup(db, files, userId, id)) ? new Response(null, { status: 204 }) : error(404, "Backup not found.");
  return error(405, "Method not allowed");
}
