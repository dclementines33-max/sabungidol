import { readMigrationFiles } from "drizzle-orm/migrator";
import { describe, expect, it } from "vitest";
import { bundledMigrations } from "./migrations";
import { openDb } from "./openDb";

describe("bundled migrations", () => {
  it("are exactly what Drizzle reads from disk (same SQL, same hash)", async () => {
    const fromDisk = readMigrationFiles({ migrationsFolder: new URL("../migrations", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") });
    expect(await bundledMigrations()).toEqual(fromDisk);
  });

  it("opening twice runs them once", async () => {
    const db = await openDb();
    const { dialect, session } = db as unknown as { dialect: { migrate: (m: unknown, s: unknown, c: unknown) => Promise<void> }; session: unknown };
    await dialect.migrate(await bundledMigrations(), session, { migrationsFolder: "" });
    const { rows } = await db.execute<{ n: number }>("select count(*)::int as n from drizzle.__drizzle_migrations");
    expect(rows[0].n).toBe((await bundledMigrations()).length);
  });
});
