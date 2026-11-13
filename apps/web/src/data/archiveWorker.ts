// Season Archive in the Worker (PRD §8): one finished season read back — its titles, the final tables of the
// 13 leagues, every cup's final places, promotion/relegation, saved rating changes and a few season numbers.
// The season is replayed from its saved matches (nothing is played).
import { type Db, listPlacements, listSeasonRatingChanges, listSeasons } from "@sabung/db";
import { computeStandings, promotionPlan, runSeason, seasonScores, seasonTop } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

export async function seasonArchive(db: Db, seasonId: string) {
  const season = (await listSeasons(db)).find((s) => s.id === seasonId);
  if (!season || season.status === "draft") return null;
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
  if (!result.done) return { season, done: false as const };
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const leagues = { ...input.leagues, IDL: input.theIdols ?? [] } as Record<string, string[]>;
  const tables = Object.entries(leagues).map(([comp, ids]) => ({
    comp, rows: computeStandings(ids.map((id) => ({ id, startRating: rating.get(id) ?? 0 })), result.matches.filter((m) => m.comp === comp && m.stage === "LG")),
  }));
  const placements = (await listPlacements(db, season.id)).filter((p) => p.finalRank <= 4 && !/^D[12][A-F]$|^IDL$/.test(p.comp));
  const plan = promotionPlan(result.matches, input.leagues, (id) => rating.get(id) ?? 0);
  return {
    season, done: true as const,
    titles: result.titles,
    seasonTop: seasonTop(seasonScores(result.matches, result.titles, leagues)), // Update 3 honours podium
    tables,
    cups: placements.sort((a, b) => a.comp.localeCompare(b.comp) || a.finalRank - b.finalRank),
    promoted: plan.promoted, relegated: plan.relegated,
    ratingChanges: await listSeasonRatingChanges(db, season.id),
    numbers: { matches: result.matches.length, draws: result.matches.filter((m) => m.result === "D").length, sweeps: result.matches.filter((m) => Math.min(m.scoreA, m.scoreB) === 0).length },
  };
}
