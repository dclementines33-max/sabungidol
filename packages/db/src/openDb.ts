// Opens the database and brings its tables up to date.
// No dataDir = in memory (tests). In the browser the Worker will pass an IndexedDB path (Fase 1).
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

export async function openDb(dataDir?: string) {
  const db = drizzle(new PGlite(dataDir), { schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)) });
  return db;
}

export type Db = Awaited<ReturnType<typeof openDb>>;
