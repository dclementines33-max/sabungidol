// The API's routes: /api/auth/* goes to Better Auth, /api/backups/* needs a logged-in session.
import type { Auth } from "./auth";
import { MAX_BACKUP_BYTES, deleteBackup, downloadBackup, listBackups, uploadBackup } from "./backups";
import type { Db } from "./db";
import type { Files } from "./files";

export type Deps = { db: Db; auth: Auth; files: Files };

const json = (body: unknown, status = 200) => Response.json(body, { status });
const error = (status: number, message: string) => json({ error: message }, status);

export async function handle(request: Request, { db, auth, files }: Deps): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/api/auth/")) return auth.handler(request);
  if (!pathname.startsWith("/api/backups")) return error(404, "Not found");

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return error(401, "Sign in to use cloud backup.");
  const userId = session.user.id;
  const id = pathname.split("/")[3]; // /api/backups/:id

  if (!id && request.method === "GET") return json(await listBackups(db, userId));
  if (!id && request.method === "POST") {
    const name = new URL(request.url).searchParams.get("name") ?? "";
    if (!/^[\w.-]{1,120}\.sabung$/.test(name)) return error(400, "The file name must end in .sabung.");
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
