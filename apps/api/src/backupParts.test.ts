// Big cloud backups go up in parts (Supabase's 50 MB object limit): each part its own object, one backup id, the
// download joined in order, delete removing every part. On PGlite with in-memory Storage.
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { expect, it } from "vitest";
import { handle } from "./app";
import { makeAuth } from "./auth";
import { memoryFiles } from "./files";
import * as schema from "./schema";

const ORIGIN = "http://localhost:8787";

async function setup() {
  const pg = new PGlite();
  const dir = new URL("../migrations/", import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) await pg.exec(readFileSync(new URL(f, dir), "utf8").replaceAll("--> statement-breakpoint", ""));
  const db = drizzle(pg, { schema, casing: "snake_case" });
  const files = memoryFiles();
  const deps = { db, auth: makeAuth(db, { secret: "test-secret-at-least-32-characters-long", baseURL: ORIGIN }), files };
  const call = (path: string, init: RequestInit = {}) => handle(new Request(`${ORIGIN}${path}`, init), deps);
  const user = async (email: string) => {
    const res = await call("/api/auth/sign-up/email", { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ email, password: "rahasia-panjang", name: email }) });
    return { cookie: res.headers.get("set-cookie")!.split(";")[0]!, id: ((await res.json()) as { user: { id: string } }).user.id };
  };
  return { call, files, user };
}

it("a big backup goes up in parts and comes back joined, in order; another user sees nothing; delete removes every part", async () => {
  const { call, files, user } = await setup();
  const a = await user("a@example.com");
  const b = await user("b@example.com");
  const upload = crypto.randomUUID();
  const parts = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5]), new Uint8Array([6])];
  const put = (i: number, body: Uint8Array, cookie = a.cookie, id: string = upload) => call(`/api/backups/upload/${id}/${i}`, { method: "PUT", headers: { cookie }, body: body as BodyInit });

  expect((await put(0, parts[0]!, a.cookie, "not-a-uuid")).status).toBe(400);
  expect((await call(`/api/backups/upload/${upload}/0`, { method: "PUT", body: parts[0] })).status).toBe(401);
  expect((await put(99, parts[0]!)).status).toBe(400);
  expect((await call(`/api/backups/upload/${upload}/`, { method: "PUT", headers: { cookie: a.cookie }, body: parts[0] })).status).toBe(400); // empty part (trailing slash)
  for (const [i, p] of parts.entries()) expect((await put(i, p)).status).toBe(201);
  expect((await call(`/api/backups/upload/${upload}?name=evil.exe&parts=3&size=6`, { method: "POST", headers: { cookie: a.cookie } })).status).toBe(400);
  const done = await call(`/api/backups/upload/${upload}?name=sabung-base-2026-11-16.sabung&parts=3&size=6`, { method: "POST", headers: { cookie: a.cookie } });
  expect(done.status).toBe(201);
  const { id } = (await done.json()) as { id: string };

  const list = (await (await call("/api/backups", { headers: { cookie: a.cookie } })).json()) as { id: string; name: string; size: number }[];
  expect(list.map((x) => [x.id, x.name, x.size])).toEqual([[id, "sabung-base-2026-11-16.sabung", 6]]);
  const file = await call(`/api/backups/${id}`, { headers: { cookie: a.cookie } });
  expect(file.headers.get("content-disposition")).toContain("sabung-base-2026-11-16.sabung");
  expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
  expect((await call(`/api/backups/${id}`, { headers: { cookie: b.cookie } })).status).toBe(404);

  expect((await call(`/api/backups/${id}`, { method: "DELETE", headers: { cookie: a.cookie } })).status).toBe(204);
  for (let i = 0; i < 3; i++) expect(await files.get(`${a.id}/${upload}.part${i}`)).toBeNull();
  expect(await (await call("/api/backups", { headers: { cookie: a.cookie } })).json()).toEqual([]);
});
