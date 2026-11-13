// Reading saved matches for the wiki (PRD §8 Match Database, Idol Profile, Head to Head): filtered, a page at a
// time with a cursor on the match id (never everything at once), plus the count. Ids sort by season, then
// competition, stage and round, so id order is also "grouped by competition and stage".
import { and, asc, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import type { Db } from "./openDb";
import { matches } from "./schema";

export type MatchFilter = { seasonId?: string; comps?: string[]; stage?: string; round?: string; idolId?: string; vsId?: string; result?: "W" | "D" | "L" };
export type MatchRow = { id: string; seasonId: string; comp: string; stage: string; round: string; idolA: string; idolB: string; scoreA: number; scoreB: number; result: string; ratingA: number; ratingB: number };

function where(f: MatchFilter) {
  const m = matches;
  const has = (id: string) => or(eq(m.idolA, id), eq(m.idolB, id));
  const won = (id: string) => or(and(eq(m.idolA, id), eq(m.result, "A")), and(eq(m.idolB, id), eq(m.result, "B")));
  const lost = (id: string) => or(and(eq(m.idolA, id), eq(m.result, "B")), and(eq(m.idolB, id), eq(m.result, "A")));
  return and(
    f.seasonId ? eq(m.seasonId, f.seasonId) : undefined,
    f.comps?.length ? inArray(m.comp, f.comps) : undefined,
    f.stage ? eq(m.stage, f.stage) : undefined,
    f.round ? eq(m.round, f.round) : undefined,
    f.idolId ? has(f.idolId) : undefined,
    f.vsId ? has(f.vsId) : undefined,
    f.result === "D" ? eq(m.result, "D") : undefined,
    f.result === "W" && f.idolId ? won(f.idolId) : undefined,
    f.result === "L" && f.idolId ? lost(f.idolId) : undefined,
  );
}

// One page after the cursor (the last id of the previous page); next = null on the last page.
export async function queryMatches(db: Db, f: MatchFilter, { after, limit = 50, newest = true }: { after?: string; limit?: number; newest?: boolean } = {}) {
  const m = matches;
  const rows: MatchRow[] = await db.select({
    id: m.id, seasonId: m.seasonId, comp: m.comp, stage: m.stage, round: m.round, idolA: m.idolA, idolB: m.idolB,
    scoreA: m.scoreA, scoreB: m.scoreB, result: m.result, ratingA: m.ratingA, ratingB: m.ratingB,
  }).from(m).where(and(where(f), after ? (newest ? lt(m.id, after) : gt(m.id, after)) : undefined))
    .orderBy(newest ? desc(m.id) : asc(m.id)).limit(limit + 1);
  return { rows: rows.slice(0, limit), next: rows.length > limit ? rows[limit - 1]!.id : null };
}

export async function countMatchesWhere(db: Db, f: MatchFilter): Promise<number> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(matches).where(where(f));
  return n;
}
