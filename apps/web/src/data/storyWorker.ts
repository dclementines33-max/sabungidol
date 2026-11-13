// Season Story in the Worker (PRD §8): the season replayed from its saved matches (nothing is played), and
// the titles of earlier seasons, so "first title" means first ever.
import { type Db, listPlacements, listSeasonMatches, listSeasons } from "@sabung/db";
import { runSeason, seasonStory } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";

export async function storyOf(db: Db, seasonId: string) {
  const seasons = await listSeasons(db);
  const season = seasons.find((s) => s.id === seasonId);
  if (!season || season.status === "draft") return [];
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await listSeasonMatches(db, season.id), target: () => false });
  const earlier = new Set(seasons.filter((s) => s.number < season.number).map((s) => s.id));
  const earlierTitles = new Set((await listPlacements(db)).filter((p) => p.finalRank === 1 && earlier.has(p.seasonId)).map((p) => `${p.idolId}|${p.comp}`));
  const stories = seasonStory(result.matches, result.titles, earlierTitles);
  return earlier.size ? stories : stories.filter((s) => s.kind !== "first-title"); // in the first season every title is a first
}
