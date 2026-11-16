// The whole cloud API in memory for tests (PGlite with every migration, Storage as a map) plus one signed-up user:
// `call` answers a Request as that user. Used by the web app's two-device sync e2e.
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { handle } from "./app";
import { makeAuth } from "./auth";
import { memoryFiles } from "./files";
import * as schema from "./schema";

const ORIGIN = "http://localhost:8787";

export async function memoryCloud(email = "sync@example.com") {
  const pg = new PGlite();
  const dir = new URL("../migrations/", import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) await pg.exec(readFileSync(new URL(f, dir), "utf8").replaceAll("--> statement-breakpoint", ""));
  const db = drizzle(pg, { schema, casing: "snake_case" });
  const deps = { db, auth: makeAuth(db, { secret: "test-secret-at-least-32-characters-long", baseURL: ORIGIN }), files: memoryFiles() };
  const res = await handle(new Request(`${ORIGIN}/api/auth/sign-up/email`, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ email, password: "rahasia-panjang", name: email }) }), deps);
  const cookie = res.headers.get("set-cookie")!.split(";")[0]!;
  return {
    call: (path: string, init: { method: string; headers: Record<string, string>; body?: Uint8Array }) =>
      handle(new Request(`${ORIGIN}${path}`, { method: init.method, headers: { ...init.headers, cookie }, body: init.body as BodyInit | undefined }), deps),
  };
}
