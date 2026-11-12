// Playing a season (Fase 3): its saved matches in the engine's shape (for the replay), removing
// matches that no longer happen, and starting a draft season once its leagues are complete.
import { D1_LEAGUES, D2_LEAGUES, type CompetitionCode, type StageCode, classifyMatch } from "@sabung/shared";
import { and, asc, eq, inArray } from "drizzle-orm";
import { gamesFromMask } from "./gamesMask";
import type { Db } from "./openDb";
import { idols, matches, seasons } from "./schema";
import { leagueRosters } from "./seasons";

export type SavedMatch = {
  id: string; comp: CompetitionCode; stage: StageCode; round: string; slot: number; idolA: string; idolB: string;
  games: ("A" | "B")[]; scoreA: number; scoreB: number; result: "A" | "B" | "D"; ratingA: number; ratingB: number; formA: string; formB: string;
};

export async function listSeasonMatches(db: Db, seasonId: string): Promise<SavedMatch[]> {
  const rows = await db.select().from(matches).where(eq(matches.seasonId, seasonId)).orderBy(asc(matches.playedAt), asc(matches.id));
  return rows.map((r) => ({
    id: r.id, comp: r.comp as CompetitionCode, stage: r.stage as StageCode, round: r.round, slot: classifyMatch(r.id).slot,
    idolA: r.idolA, idolB: r.idolB, games: gamesFromMask(r.games, r.scoreA + r.scoreB), scoreA: r.scoreA, scoreB: r.scoreB,
    result: r.result as "A" | "B" | "D", ratingA: r.ratingA, ratingB: r.ratingB, formA: r.formA, formB: r.formB,
  }));
}

// Matches the replay says no longer happen (an earlier result was changed by hand).
export async function deleteMatches(db: Db, seasonId: string, ids: string[]) {
  if (ids.length) await db.delete(matches).where(and(eq(matches.seasonId, seasonId), inArray(matches.id, ids)));
}

// Why a season cannot start yet (empty = it can): every league exactly 20, nobody inactive.
export async function startProblems(db: Db, seasonId: string): Promise<string[]> {
  const rosters = await leagueRosters(db, seasonId);
  const inactive = new Map((await db.select({ id: idols.id, name: idols.name }).from(idols).where(eq(idols.active, false))).map((i) => [i.id, i.name]));
  const problems: string[] = [];
  for (const code of [...D1_LEAGUES, ...D2_LEAGUES]) {
    const ids = rosters[code] ?? [];
    if (ids.length !== 20) problems.push(`${code} berisi ${ids.length} idol, harus 20`);
    const off = ids.filter((id) => inactive.has(id)).map((id) => inactive.get(id));
    if (off.length) problems.push(`${code} berisi idol nonaktif: ${off.join(", ")}`);
  }
  return problems;
}

export async function startSeason(db: Db, seasonId: string): Promise<{ ok: true } | { ok: false; problems: string[] }> {
  const problems = await startProblems(db, seasonId);
  if (problems.length) return { ok: false, problems };
  await db.update(seasons).set({ status: "live" }).where(and(eq(seasons.id, seasonId), eq(seasons.status, "draft")));
  return { ok: true };
}
