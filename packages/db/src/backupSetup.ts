// Backup import of the setup (Update 4 fix): idols matched by name + group, and a season's settings + league rosters.
// Before this, "Data dasar" brought the live season along (a new device read "Season 6" with no match), and Replace of
// idols/roster/season broke on foreign keys or on idol ids made by another device.
import { and, eq, sql } from "drizzle-orm";
import type { BackupTables } from "./backupRead";
import type { Tx } from "./openDb";
import { achievements, competitions, entries, groups, idols, matches, photos, placements, ratingHistory, seasons, statsCache } from "./schema";
import { currentSeason } from "./seasons";

export type SetupResult = { added: number; replaced: number; conflicts: string[]; unknown: string[] };
type Row = Record<string, unknown>;
const key = (name: unknown, group: unknown) => `${String(name).toLowerCase()}|${String(group ?? "").toLowerCase()}`;
const IDOL_COPY = ["rating", "seed", "nationality", "birthday", "role", "photoId", "active", "gallery"] as const;

// Groups by name, photos by id, idols by name + group. overwrite: an existing idol takes the backup's fields
// (Replace); otherwise it keeps its own and only gets the backup's gallery when it has none (Merge).
// Returns backup idol id → this database's id, for every idol the backup names (idol_keys included).
export async function upsertIdols(tx: Tx, tables: BackupTables, overwrite: boolean, result: SetupResult): Promise<Map<unknown, string>> {
  const groupName = new Map((tables.groups ?? []).map((g) => [g.id, g.name]));
  const existingGroups = new Map((await tx.select().from(groups)).map((g) => [g.name.toLowerCase(), g.id]));
  const groupMap = new Map<unknown, string>();
  for (const g of tables.groups ?? []) {
    const found = existingGroups.get(String(g.name).toLowerCase());
    if (!found) result.added += (await tx.insert(groups).values(g as never).returning()).length;
    groupMap.set(g.id, found ?? (g.id as string));
  }
  for (const p of tables.photos ?? []) result.added += (await tx.insert(photos).values(p as never).onConflictDoNothing().returning()).length;

  const existing = await tx.select({ id: idols.id, name: idols.name, rating: idols.rating, group: groups.name, gallery: idols.gallery }).from(idols).leftJoin(groups, eq(idols.groupId, groups.id));
  const byKey = new Map(existing.map((i) => [key(i.name, i.group), i]));
  const idolMap = new Map<unknown, string>();
  for (const i of tables.idols ?? []) {
    const group = i.groupId ? groupName.get(i.groupId) : null;
    const found = byKey.get(key(i.name, group));
    if (!found) {
      result.added += (await tx.insert(idols).values({ ...i, groupId: i.groupId ? groupMap.get(i.groupId) : null } as never).returning()).length;
      idolMap.set(i.id, i.id as string);
      continue;
    }
    idolMap.set(i.id, found.id);
    if (overwrite) {
      await tx.update(idols).set(Object.fromEntries(IDOL_COPY.filter((f) => f in i).map((f) => [f, i[f]])) as never).where(eq(idols.id, found.id));
      result.replaced++;
    } else {
      if (found.rating !== i.rating) result.conflicts.push(`${i.name} (${group ?? "Soloist"}): rating here ${found.rating}, in the backup ${i.rating} — keeping ${found.rating}`);
      const gallery = (i.gallery as string[] | undefined) ?? [];
      if (!found.gallery.length && gallery.length) await tx.update(idols).set({ gallery }).where(eq(idols.id, found.id));
    }
  }
  for (const k of tables.idol_keys ?? []) { // sections without idols say who their ids are
    if (idolMap.has(k.id)) continue;
    const found = byKey.get(key(k.name, k.groupName));
    if (found) idolMap.set(k.id, found.id);
  }
  return idolMap;
}

// Every season and everything played in them (idols, groups, photos and the event log stay).
export async function wipeSeasons(tx: Tx): Promise<number> {
  let n = 0;
  for (const table of [achievements, placements, ratingHistory, matches, entries, competitions, seasons, statsCache]) n += (await tx.delete(table).returning()).length;
  return n;
}

// The backup's newest season as this database's setup: its settings (without the opener, which belongs to a played
// season), branding and league rosters (The Idols is picked at season start). wipe: all seasons go and it becomes
// Season 1 draft. Otherwise it is applied to the current season only while that is a draft without matches.
export async function applySetup(tx: Tx, tables: BackupTables, idolMap: Map<unknown, string>, wipe: boolean, result: SetupResult) {
  const source = [...(tables.seasons ?? [])].sort((a, b) => (b.number as number) - (a.number as number))[0];
  if (!source) return;
  const { opener: _opener, ...config } = (source.config ?? {}) as Row;
  let target = await currentSeason(tx);
  if (wipe) {
    result.replaced += await wipeSeasons(tx);
    target = undefined;
  } else if (target) {
    const [played] = await tx.select({ n: sql<number>`count(*)::int` }).from(matches).where(eq(matches.seasonId, target.id));
    if (target.status !== "draft" || played!.n > 0) {
      result.conflicts.push(`${target.name} is already live — the backup's settings & rosters weren't applied (use Replace with Base data to start over)`);
      return;
    }
    result.replaced += (await tx.delete(entries).where(and(eq(entries.seasonId, target.id), eq(entries.stage, "LG"))).returning()).length;
    result.replaced += (await tx.delete(competitions).where(eq(competitions.seasonId, target.id)).returning()).length;
    await tx.update(seasons).set({ config }).where(eq(seasons.id, target.id));
  }
  const seasonId = target?.id ?? "S01";
  if (!target) result.added += (await tx.insert(seasons).values({ id: seasonId, number: 1, name: "Season 1", seed: source.seed as string, status: "draft", config }).returning()).length;
  const branding = (tables.competitions ?? []).filter((c) => c.seasonId === source.id).map((c) => ({ ...c, seasonId }));
  if (branding.length) result.added += (await tx.insert(competitions).values(branding as never).returning()).length;
  const unknown = new Set<string>();
  const rows = (tables.entries ?? []).filter((e) => e.seasonId === source.id && e.stage === "LG" && e.comp !== "IDL").flatMap((e) => {
    const idolId = idolMap.get(e.idolId);
    if (!idolId) { unknown.add(String(e.idolId)); return []; }
    return [{ ...e, seasonId, idolId }];
  });
  for (let i = 0; i < rows.length; i += 500) result.added += (await tx.insert(entries).values(rows.slice(i, i + 500) as never).returning()).length;
  const names = new Map((tables.idol_keys ?? []).map((k) => [k.id, `${k.name} (${k.groupName ?? "Soloist"})`]));
  result.unknown.push(...[...unknown].map((id) => (names.get(id) as string) ?? id));
}
