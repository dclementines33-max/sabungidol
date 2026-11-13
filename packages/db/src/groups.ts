// Girl groups (PRD §3). A group is found by name, case-insensitive; a missing one is created.
import { ulid } from "@sabung/shared";
import { asc, eq, sql } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { groups } from "./schema";

export async function listGroups(db: Db | Tx) {
  return db.select({ id: groups.id, name: groups.name, logoId: groups.logoId }).from(groups).orderBy(asc(sql`lower(${groups.name})`));
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

// A group's logo (stored like a photo; null removes it).
export async function setGroupLogo(db: Db | Tx, id: string, logoId: string | null) {
  await db.update(groups).set({ logoId }).where(eq(groups.id, id));
}

// A new girl group by name (Update 3: Girl Groups panel); an existing name (any case) gives the existing group.
export async function addGroup(db: Db | Tx, name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nama grup kosong");
  return (await ensureGroups(db, [trimmed])).get(trimmed.toLowerCase())!;
}
