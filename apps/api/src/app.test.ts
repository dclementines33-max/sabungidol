// The cloud API end to end on PGlite (same SQL as Supabase): sign up, upload, list, download the same
// bytes, delete — and another user, or nobody, gets none of it.
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { describe, expect, it } from "vitest";
import { handle } from "./app";
import { makeAuth } from "./auth";
import { memoryFiles } from "./files";
import * as schema from "./schema";

const ORIGIN = "http://localhost:8787";
const migrations = new URL("../migrations/", import.meta.url);

async function setup() {
  const pg = new PGlite();
  for (const file of readdirSync(migrations).filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(new URL(file, migrations), "utf8").replaceAll("--> statement-breakpoint", ""));
  const db = drizzle(pg, { schema, casing: "snake_case" });
  const deps = { db, auth: makeAuth(db, { secret: "test-secret-at-least-32-characters-long", baseURL: ORIGIN }), files: memoryFiles() };
  const call = (path: string, init: RequestInit = {}) => handle(new Request(`${ORIGIN}${path}`, init), deps);
  return { pg, call };
}

async function signUp(call: Awaited<ReturnType<typeof setup>>["call"], email: string) {
  const res = await call("/api/auth/sign-up/email", { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ email, password: "rahasia-panjang", name: email }) });
  expect(res.status).toBe(200);
  return { cookie: res.headers.get("set-cookie")!.split(";")[0]! };
}

describe("cloud backup API", () => {
  it("keeps each user's backups to themselves", async () => {
    const { pg, call } = await setup();
    const a = await signUp(call, "a@example.com");
    const b = await signUp(call, "b@example.com");
    const bytes = new Uint8Array([1, 2, 3, 250]);

    expect((await call("/api/backups")).status).toBe(401);
    const up = await call("/api/backups?name=sabung-idol-2026-11-13.sabung", { method: "POST", headers: { cookie: a.cookie }, body: bytes });
    expect(up.status).toBe(201);
    const { id } = (await up.json()) as { id: string };
    expect((await call("/api/backups?name=evil.exe", { method: "POST", headers: { cookie: a.cookie }, body: bytes })).status).toBe(400);

    const list = (await (await call("/api/backups", { headers: { cookie: a.cookie } })).json()) as { id: string; name: string; size: number }[];
    expect(list.map(({ id, name, size }) => ({ id, name, size }))).toEqual([{ id, name: "sabung-idol-2026-11-13.sabung", size: 4 }]);
    expect(new Uint8Array(await (await call(`/api/backups/${id}`, { headers: { cookie: a.cookie } })).arrayBuffer())).toEqual(bytes);

    expect(await (await call("/api/backups", { headers: { cookie: b.cookie } })).json()).toEqual([]);
    expect((await call(`/api/backups/${id}`, { headers: { cookie: b.cookie } })).status).toBe(404);
    expect((await call(`/api/backups/${id}`, { method: "DELETE", headers: { cookie: b.cookie } })).status).toBe(404);

    expect((await call(`/api/backups/${id}`, { method: "DELETE", headers: { cookie: a.cookie } })).status).toBe(204);
    expect(await (await call("/api/backups", { headers: { cookie: a.cookie } })).json()).toEqual([]);
    expect((await pg.query("select relname from pg_class where relrowsecurity order by relname")).rows.map((r) => (r as { relname: string }).relname))
      .toEqual(["account", "cloud_backup", "session", "sync_file", "sync_record", "user", "verification"]);
  });
});
