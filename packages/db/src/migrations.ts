// The migrations drizzle-kit wrote, bundled into the code (no disk reads), so the same list
// runs in Node tests and in the browser Worker. Same shape and hash as Drizzle's own file reader.
import type { MigrationMeta } from "drizzle-orm/migrator";
import journal from "../migrations/meta/_journal.json";

const files = import.meta.glob<string>("../migrations/*.sql", { query: "?raw", import: "default", eager: true });

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function bundledMigrations(): Promise<MigrationMeta[]> {
  return Promise.all(journal.entries.map(async (entry) => {
    const query = files[`../migrations/${entry.tag}.sql`];
    if (query === undefined) throw new Error(`Migration ${entry.tag}.sql is missing from the bundle`);
    return {
      sql: query.split("--> statement-breakpoint"),
      bps: entry.breakpoints,
      folderMillis: entry.when,
      hash: hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(query))),
    };
  }));
}
