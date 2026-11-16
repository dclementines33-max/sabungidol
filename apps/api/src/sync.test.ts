// Cloud sync API on PGlite (same SQL as Supabase): last write wins, gallery entries add-only, each user sees only their
// own records, and a photo goes up once per name (the original's hash; the bytes may be its 1024 copy).
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { expect, it } from "vitest";
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
  const user = async (email: string) => {
    const res = await call("/api/auth/sign-up/email", { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ email, password: "rahasia-panjang", name: email }) });
    const cookie = res.headers.get("set-cookie")!.split(";")[0]!;
    const push = (rows: unknown[]) => call("/api/sync", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ rows }) });
    const pull = async (since = 0) => (await (await call(`/api/sync?since=${since}`, { headers: { cookie } })).json()) as { rows: { kind: string; key: string; data: Record<string, unknown>; seq: number }[]; seq: number; more: boolean };
    return { cookie, push, pull };
  };
  return { call, user };
}
const at = (minute: number) => new Date(Date.UTC(2026, 10, 16, 10, minute)).toISOString();

it("last write wins per record, gallery is add-only, and a pull only brings what changed since", async () => {
  const { call, user } = await setup();
  const a = await user("a@example.com");
  expect((await call("/api/sync")).status).toBe(401);
  expect((await a.push([{ kind: "idol", key: "x", data: { name: "X" }, updatedAt: "yesterday" }])).status).toBe(400);

  await a.push([{ kind: "idol", key: "mina|twice", data: { name: "Mina" }, updatedAt: at(5) }, { kind: "gallery", key: "mina|twice|h1", data: { idol: "mina|twice", hash: "h1" }, updatedAt: at(5) }]);
  const first = await a.pull();
  expect(first.rows.map((r) => r.kind)).toEqual(["idol", "gallery"]);

  await a.push([{ kind: "idol", key: "mina|twice", data: { name: "Old" }, updatedAt: at(1) }]); // older: ignored
  await a.push([{ kind: "gallery", key: "mina|twice|h1", data: { idol: "mina|twice", hash: "h1" }, updatedAt: at(9) }]); // re-sent: not news
  expect((await a.pull(first.seq)).rows).toEqual([]);

  await a.push([{ kind: "idol", key: "mina|twice", data: { name: "Myoui Mina" }, updatedAt: at(7) }]); // newer: wins, comes again
  const next = await a.pull(first.seq);
  expect(next.rows.map((r) => [r.key, r.data.name])).toEqual([["mina|twice", "Myoui Mina"]]);

  const b = await user("b@example.com");
  expect((await b.pull()).rows).toEqual([]); // another user's records stay theirs
});

it("photos: listed as stored once uploaded, private to the user; the name must be a hash", async () => {
  const { call, user } = await setup();
  const a = await user("a@example.com");
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((x) => x.toString(16).padStart(2, "0")).join("");
  const missing = async (u: { cookie: string }) => ((await (await call("/api/sync/photos/missing", { method: "POST", headers: { cookie: u.cookie, "content-type": "application/json" }, body: JSON.stringify({ hashes: [hash] }) })).json()) as { missing: string[] }).missing;

  expect(await missing(a)).toEqual([hash]);
  expect((await call("/api/sync/photos/not-a-hash", { method: "PUT", headers: { cookie: a.cookie }, body: bytes })).status).toBe(400);
  expect((await call(`/api/sync/photos/${hash}`, { method: "PUT", headers: { cookie: a.cookie }, body: bytes })).status).toBe(201);
  expect(await missing(a)).toEqual([]);
  expect(new Uint8Array(await (await call(`/api/sync/photos/${hash}`, { headers: { cookie: a.cookie } })).arrayBuffer())).toEqual(bytes);

  const b = await user("b@example.com");
  expect(await missing(b)).toEqual([hash]);
  expect((await call(`/api/sync/photos/${hash}`, { headers: { cookie: b.cookie } })).status).toBe(404);
});
