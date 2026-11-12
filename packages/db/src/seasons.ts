// Seasons and their league rosters (PRD §12.1: seasons + entries). A new season starts as a draft
// with its 12 league rosters saved in one transaction.
import { and, asc, desc, eq } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { competitions, entries, seasons } from "./schema";

export type SeasonRow = { id: string; number: number; name: string; seed: string; status: string; config: unknown };

export async function createDraftSeason(db: Db, season: { id: string; number: number; name: string; seed: string; leagues: Record<string, string[]>; config?: unknown }) {
  await db.transaction(async (tx) => {
    await tx.insert(seasons).values({ id: season.id, number: season.number, name: season.name, seed: season.seed, status: "draft", config: season.config ?? null });
    const rows = Object.entries(season.leagues).flatMap(([comp, ids]) =>
      ids.map((idolId, i) => ({ seasonId: season.id, comp, stage: "LG", idolId, slot: i + 1, source: "data-maker" })));
    if (rows.length > 0) await tx.insert(entries).values(rows);
  });
}

// The season being prepared or played: the one with the highest number.
export async function currentSeason(db: Db | Tx): Promise<SeasonRow | undefined> {
  const [row] = await db.select().from(seasons).orderBy(desc(seasons.number)).limit(1);
  return row;
}

// League code → idol ids in roster order.
export async function leagueRosters(db: Db | Tx, seasonId: string): Promise<Record<string, string[]>> {
  const rows = await db.select({ comp: entries.comp, idolId: entries.idolId }).from(entries)
    .where(and(eq(entries.seasonId, seasonId), eq(entries.stage, "LG"))).orderBy(asc(entries.comp), asc(entries.slot));
  const rosters: Record<string, string[]> = {};
  for (const r of rows) (rosters[r.comp] ??= []).push(r.idolId);
  return rosters;
}

// Swaps one idol for another in a season's league roster, keeping the place (Inactive Manager,
// PRD §8). Refused when the newcomer already has a league place that season.
export async function replaceInRoster(db: Db | Tx, seasonId: string, outId: string, inId: string) {
  const taken = await db.select({ comp: entries.comp }).from(entries)
    .where(and(eq(entries.seasonId, seasonId), eq(entries.stage, "LG"), eq(entries.idolId, inId)));
  if (taken.length) throw new Error(`Pengganti sudah ada di roster ${taken[0]!.comp}`);
  await db.update(entries).set({ idolId: inId, source: "replacement" })
    .where(and(eq(entries.seasonId, seasonId), eq(entries.stage, "LG"), eq(entries.idolId, outId)));
}

// Settings → Season: name and config (competitions on/off, BoN per stage).
export async function updateSeason(db: Db, id: string, change: { name?: string; config?: unknown }) {
  await db.update(seasons).set(change).where(eq(seasons.id, id));
}

// Settings → Roster liga / Data Maker: replaces the rosters of the given leagues, in one go.
// Only while the season is a draft: a running season changes rosters through its own flow (Fase 3).
export async function setLeagueRosters(db: Db, seasonId: string, leagues: Record<string, string[]>) {
  await db.transaction(async (tx) => {
    const [season] = await tx.select({ status: seasons.status }).from(seasons).where(eq(seasons.id, seasonId));
    if (season?.status !== "draft") throw new Error("Roster hanya bisa diubah saat season masih draft");
    for (const [comp, ids] of Object.entries(leagues)) {
      await tx.delete(entries).where(and(eq(entries.seasonId, seasonId), eq(entries.stage, "LG"), eq(entries.comp, comp)));
      if (ids.length) await tx.insert(entries).values(ids.map((idolId, i) => ({ seasonId, comp, stage: "LG", idolId, slot: i + 1, source: "settings" })));
    }
  });
}

// Settings → Branding: a competition's display name, accent colour and logo (a photo id) per season.
export type Branding = { color?: string; logoId?: string | null };
export async function listCompetitions(db: Db | Tx, seasonId: string) {
  return db.select({ code: competitions.code, name: competitions.name, branding: competitions.branding }).from(competitions).where(eq(competitions.seasonId, seasonId));
}
export async function saveCompetition(db: Db, seasonId: string, code: string, name: string, branding: Branding) {
  await db.insert(competitions).values({ seasonId, code, name, branding })
    .onConflictDoUpdate({ target: [competitions.seasonId, competitions.code], set: { name, branding } });
}
