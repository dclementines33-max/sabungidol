// Seasons and their league rosters (PRD §12.1: seasons + entries). A new season starts as a draft
// with its 12 league rosters saved in one transaction.
import { and, asc, desc, eq } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { entries, seasons } from "./schema";

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
