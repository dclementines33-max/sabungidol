// Backup (PRD §12.3), writing. Replace: the section's rows are deleted and the backup's put back as
// they were (same ids). Merge: nothing existing changes; idols and groups are matched by name +
// group (every install makes its own ids), seasons by id/number (an existing one is skipped).
// The preview is the real import in a transaction that is then rolled back, so it never lies.
import { and, eq, sql } from "drizzle-orm";
import { type BackupTables, TABLE_ORDER, type TableName } from "./backupRead";
import { applySetup, setupOpen, upsertIdols } from "./backupSetup";
import type { Db, Tx } from "./openDb";
import { achievements, competitions, entries, groups, idols, matches, photos, placements, ratingHistory, seasons, statsCache } from "./schema";

export type ImportMode = "merge" | "replace";
export type ImportResult = { added: number; replaced: number; conflicts: string[]; unknown: string[] };
type Row = Record<string, unknown>;

const TABLES = { groups, photos, idols, seasons, competitions, entries, matches, placements, rating_history: ratingHistory, achievements } as const;
const IDOL_FIELDS = ["idolId", "idolA", "idolB"];
const DRY_RUN = new Error("dry run");
const key = (name: unknown, group: unknown) => `${String(name).toLowerCase()}|${String(group ?? "").toLowerCase()}`;
// JSON has no dates: the two timestamp columns come back as Date.
const revive = (row: Row) => ({ ...row, ...(row.playedAt ? { playedAt: new Date(row.playedAt as string) } : {}), ...(row.at ? { at: new Date(row.at as string) } : {}) });

export async function importBackup(db: Db, tables: BackupTables, mode: ImportMode, dryRun: boolean): Promise<ImportResult> {
  let result!: ImportResult;
  try {
    await db.transaction(async (tx) => {
      result = await importShape(tx, tables, mode);
      await tx.delete(statsCache); // a cache: always rebuilt
      if (dryRun) throw DRY_RUN;
    });
  } catch (error) {
    if (error !== DRY_RUN) throw error;
  }
  return result;
}

// What a backup holds decides how it goes in (the sections of backupRead.ts SECTION_TABLES).
async function importShape(tx: Tx, tables: BackupTables, mode: ImportMode): Promise<ImportResult> {
  const result: ImportResult = { added: 0, replaced: 0, conflicts: [], unknown: [] };
  if (tables.rating_history && tables.idols && !tables.groups) return ratings(tx, tables, mode);
  if (tables.groups && !tables.seasons) { await upsertIdols(tx, tables, mode === "replace", result); return result; } // idols: never deleted
  if (tables.seasons && !tables.matches) { // base (with idols) or roster (without): the setup of a season, never a played one
    const takeRating = mode === "merge" && !!tables.groups && (await setupOpen(tx)); // base: ratings are part of the setup
    const idolMap = await upsertIdols(tx, tables, mode === "replace", result, takeRating);
    await applySetup(tx, tables, idolMap, mode === "replace" && !!tables.groups, result);
    return result;
  }
  if (!tables.groups && mode === "replace") { // one season: it goes, then comes back with this database's idol ids
    for (const s of tables.seasons ?? []) result.replaced += await deleteSeason(tx, s.id as string);
    const merged = await merge(tx, tables);
    return { ...merged, replaced: result.replaced };
  }
  return mode === "replace" ? replace(tx, tables) : merge(tx, tables); // full
}

async function deleteSeason(tx: Tx, seasonId: string): Promise<number> {
  let n = 0;
  for (const table of [achievements, placements, ratingHistory, matches, entries, competitions]) n += (await tx.delete(table).where(eq(table.seasonId, seasonId)).returning()).length;
  return n + (await tx.delete(seasons).where(eq(seasons.id, seasonId)).returning()).length;
}

async function replace(tx: Tx, tables: BackupTables): Promise<ImportResult> {
  const names = TABLE_ORDER.filter((n) => tables[n]);
  // A single-season backup replaces that season only; the others replace whole tables.
  const seasonId = !tables.groups && tables.seasons?.length === 1 && tables.matches ? (tables.seasons[0]!.id as string) : null;
  let replaced = 0;
  for (const name of [...names].reverse()) {
    const table = TABLES[name];
    const scope = seasonId ? eq(name === "seasons" ? seasons.id : (table as typeof matches).seasonId, seasonId) : undefined;
    replaced += (await tx.delete(table).where(scope).returning()).length;
  }
  let added = 0;
  for (const name of names) for (let i = 0; i < tables[name]!.length; i += 500) {
    added += (await tx.insert(TABLES[name]).values(tables[name]!.slice(i, i + 500).map(revive) as never).returning()).length;
  }
  return { added, replaced, conflicts: [], unknown: [] };
}

async function merge(tx: Tx, tables: BackupTables): Promise<ImportResult> {
  const result: ImportResult = { added: 0, replaced: 0, conflicts: [], unknown: [] };
  const idolMap = await upsertIdols(tx, tables, false, result);

  // A draft nobody played yet (a new device's Season 1) makes way for played seasons from the backup.
  const newest = Math.max(0, ...(tables.seasons ?? []).map((s) => s.number as number));
  for (const s of await tx.select({ id: seasons.id, number: seasons.number, status: seasons.status }).from(seasons)) {
    const [played] = await tx.select({ n: sql<number>`count(*)::int` }).from(matches).where(eq(matches.seasonId, s.id));
    if (tables.matches && s.status === "draft" && played!.n === 0 && s.number <= newest) result.replaced += await deleteSeason(tx, s.id);
  }
  const takenSeasons = await tx.select({ id: seasons.id, number: seasons.number }).from(seasons);
  const skipped = new Set<unknown>();
  for (const s of tables.seasons ?? []) {
    if (takenSeasons.some((t) => t.id === s.id || t.number === s.number)) {
      skipped.add(s.id);
      result.conflicts.push(`${s.name} already exists — skipped (use Replace to overwrite)`);
    } else result.added += (await tx.insert(seasons).values(s as never).returning()).length;
  }
  const unknownIds = new Set<string>();
  for (const name of ["competitions", "entries", "matches", "placements", "rating_history", "achievements"] as TableName[]) {
    for (const row of tables[name] ?? []) {
      if (skipped.has(row.seasonId)) continue;
      const missing = IDOL_FIELDS.filter((f) => f in row && !idolMap.has(row[f]));
      if (missing.length) { missing.forEach((f) => unknownIds.add(String(row[f]))); continue; }
      const mapped = Object.fromEntries(Object.entries(row).map(([f, v]) => [f, IDOL_FIELDS.includes(f) ? idolMap.get(v) : v]));
      result.added += (await tx.insert(TABLES[name]).values(revive(mapped) as never).onConflictDoNothing().returning()).length;
    }
  }
  const names = new Map((tables.idol_keys ?? []).map((k) => [k.id, `${k.name} (${k.groupName ?? "Soloist"})`]));
  result.unknown = [...unknownIds].map((id) => names.get(id) as string ?? id);
  return result;
}

// The Rating section: backup ratings are applied to the idols found by name + group; Replace also
// replaces the rating history, Merge adds the history rows that are missing.
async function ratings(tx: Tx, tables: BackupTables, mode: ImportMode): Promise<ImportResult> {
  const result: ImportResult = { added: 0, replaced: 0, conflicts: [], unknown: [] };
  const existing = await tx.select({ id: idols.id, name: idols.name, rating: idols.rating, group: groups.name }).from(idols).leftJoin(groups, eq(idols.groupId, groups.id));
  const byKey = new Map(existing.map((i) => [key(i.name, i.group), i]));
  const keys = new Map((tables.idol_keys ?? []).map((k) => [k.id, k]));
  const idolMap = new Map<unknown, string>();
  for (const i of tables.idols ?? []) {
    const k = keys.get(i.id);
    const found = byKey.get(key(i.name, k?.groupName));
    if (!found) { result.unknown.push(`${i.name} (${k?.groupName ?? "Soloist"})`); continue; }
    idolMap.set(i.id, found.id);
    if (found.rating !== i.rating) {
      result.conflicts.push(`${i.name}: rating ${found.rating} → ${i.rating}`);
      await tx.update(idols).set({ rating: i.rating as number }).where(eq(idols.id, found.id));
      result.replaced++;
    }
  }
  if (mode === "replace") result.replaced += (await tx.delete(ratingHistory).returning()).length;
  const seasonIds = new Set((await tx.select({ id: seasons.id }).from(seasons)).map((s) => s.id)); // history of a season not here keeps no season
  for (const h of tables.rating_history ?? []) {
    const idolId = idolMap.get(h.idolId);
    if (!idolId) continue;
    const at = new Date(h.at as string);
    const [dupe] = await tx.select({ n: sql<number>`1` }).from(ratingHistory).where(and(eq(ratingHistory.idolId, idolId), eq(ratingHistory.at, at), eq(ratingHistory.new, h.new as number)));
    const seasonId = seasonIds.has(h.seasonId as string) ? h.seasonId : null;
    if (!dupe) result.added += (await tx.insert(ratingHistory).values({ ...revive(h), idolId, seasonId } as never).returning()).length;
  }
  return result;
}
