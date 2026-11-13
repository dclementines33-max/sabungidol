// Season Story in the Worker (PRD §8): the season replayed from its saved matches (nothing is played), and
// the titles of earlier seasons, so "first title" means first ever.
import { type Db, leagueTotals, listPlacements, listSeasons } from "@sabung/db";
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { runSeason, seasonDrama, seasonStory } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

export async function storyOf(db: Db, seasonId: string) {
  const seasons = await listSeasons(db);
  const season = seasons.find((s) => s.id === seasonId);
  if (!season || season.status === "draft") return [];
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
  const earlier = new Set(seasons.filter((s) => s.number < season.number).map((s) => s.id));
  const placements = await listPlacements(db);
  const earlierTitles = new Set(placements.filter((p) => p.finalRank === 1 && earlier.has(p.seasonId)).map((p) => `${p.idolId}|${p.comp}`));
  const stories = seasonStory(result.matches, result.titles, earlierTitles);
  // The most league points one idol made in an earlier season (SQL totals per league; the IDL league is not counted).
  let best: number | null = earlier.size ? 0 : null;
  for (const id of earlier) for (const comp of [...D1_LEAGUES, ...D2_LEAGUES]) for (const r of await leagueTotals(db, id, comp)) best = Math.max(best!, r.points);
  const drama = seasonDrama(result.matches, best);
  return [...drama, ...(earlier.size ? stories : stories.filter((s) => s.kind !== "first-title"))]; // in the first season every title is a first
}
