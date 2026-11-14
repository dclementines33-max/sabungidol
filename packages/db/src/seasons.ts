// Seasons and their league rosters (PRD §12.1: seasons + entries). A new season starts as a draft
// with its 12 league rosters saved in one transaction.
import { and, asc, desc, eq } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { achievements, competitions, entries, idols, matches, placements, ratingHistory, seasons, statsCache } from "./schema";

export type SeasonRow = { id: string; number: number; name: string; seed: string; status: string; config: unknown };

export async function createDraftSeason(db: Db, season: { id: string; number: number; name: string; seed: string; leagues: Record<string, string[]>; config?: unknown }) {
  await db.transaction(async (tx) => {
    const previous = await currentSeason(tx);
    await tx.insert(seasons).values({ id: season.id, number: season.number, name: season.name, seed: season.seed, status: "draft", config: season.config ?? null });
    // Branding carries over: the new season keeps the last season's names, colours and logos.
    const branding = previous ? await listCompetitions(tx, previous.id) : [];
    if (branding.length > 0) await tx.insert(competitions).values(branding.map((c) => ({ ...c, seasonId: season.id })));
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
  if (taken.length) throw new Error(`The replacement is already in the ${taken[0]!.comp} roster`);
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
    if (season?.status !== "draft") throw new Error("Rosters can only change while the season is a draft");
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

// Danger Zone → Reset Season (PRD §8): the season back to a draft with the same rosters — its
// matches, placements, badges and rating changes are removed and every idol gets back the rating
// it had before the season. One transaction: all of it or nothing.
export async function resetSeason(db: Db, seasonId: string) {
  await db.transaction(async (tx) => {
    const changes = await tx.select({ idolId: ratingHistory.idolId, old: ratingHistory.old }).from(ratingHistory)
      .where(eq(ratingHistory.seasonId, seasonId)).orderBy(asc(ratingHistory.id));
    const before = new Map<string, number>();
    for (const c of changes) if (!before.has(c.idolId)) before.set(c.idolId, c.old); // the first change holds the start rating
    for (const [idolId, rating] of before) await tx.update(idols).set({ rating }).where(eq(idols.id, idolId));
    await tx.delete(ratingHistory).where(eq(ratingHistory.seasonId, seasonId));
    await tx.delete(achievements).where(eq(achievements.seasonId, seasonId));
    await tx.delete(placements).where(eq(placements.seasonId, seasonId));
    await tx.delete(matches).where(eq(matches.seasonId, seasonId));
    await tx.delete(statsCache); // a cache: always rebuilt from the tables
    await tx.update(seasons).set({ status: "draft" }).where(eq(seasons.id, seasonId));
  });
}

// Closing a season (PRD §4): it stays in the database, read-only, as an archive.
export async function archiveSeason(db: Db, seasonId: string) {
  await db.update(seasons).set({ status: "archived" }).where(eq(seasons.id, seasonId));
}

export async function listSeasons(db: Db | Tx): Promise<SeasonRow[]> {
  return db.select().from(seasons).orderBy(desc(seasons.number));
}
