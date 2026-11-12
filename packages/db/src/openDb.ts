// Opens the database and brings its tables up to date.
// dataDir: none = in memory (tests); "opfs-ahp://name" (browser Worker) or "idb://name" (its fallback).
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { PgDialect, PgSession } from "drizzle-orm/pg-core";
import { bundledMigrations } from "./migrations";
import * as schema from "./schema";

export async function openDb(dataDir?: string) {
  const db = drizzle(new PGlite(dataDir), { schema, casing: "snake_case" });
  // What drizzle-orm/pglite/migrator does, minus reading files from disk (dialect/session are not in the public types).
  const { dialect, session } = db as unknown as { dialect: PgDialect; session: PgSession };
  await dialect.migrate(await bundledMigrations(), session, { migrationsFolder: "" });
  return db;
}

export type Db = Awaited<ReturnType<typeof openDb>>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]; // inside db.transaction(...)
