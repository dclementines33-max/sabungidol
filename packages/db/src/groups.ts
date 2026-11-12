// Girl groups (PRD §3). A group is found by name, case-insensitive; a missing one is created.
import { ulid } from "@sabung/shared";
import { asc, sql } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { groups } from "./schema";

export async function listGroups(db: Db | Tx) {
  return db.select({ id: groups.id, name: groups.name }).from(groups).orderBy(asc(sql`lower(${groups.name})`));
}

// Returns lower-case name → id for every name given, creating the groups that do not exist yet.
export async function ensureGroups(db: Db | Tx, names: string[]): Promise<Map<string, string>> {
  const byName = new Map((await listGroups(db)).map((g) => [g.name.toLowerCase(), g.id]));
  const firstSpelling = new Map<string, string>(); // "IVE" then "ive" → the group is called "IVE"
  for (const n of names) if (!firstSpelling.has(n.trim().toLowerCase())) firstSpelling.set(n.trim().toLowerCase(), n.trim());
  const missing = [...firstSpelling].filter(([key]) => !byName.has(key));
  if (missing.length > 0) {
    const rows = missing.map(([key, name]) => ({ key, id: ulid(), name }));
    await db.insert(groups).values(rows.map(({ id, name }) => ({ id, name })));
    for (const row of rows) byName.set(row.key, row.id);
  }
  return byName;
}
