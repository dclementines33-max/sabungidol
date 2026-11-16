// End-of-season awards in the Worker (2026-11-17): the season replayed from its saved matches (nothing is played), Glow Up
// from the same season-end rating model as the verdict (so it shows before ratings are saved), Golden Disk ties broken by
// this season's badges. Only for a finished season.
import { type Db, listAchievements, listSeasons } from "@sabung/db";
import { promotionPlan, runSeason, seasonAwards, seasonProgression } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

export async function awardsOf(db: Db, seasonId: string) {
  const season = (await listSeasons(db)).find((s) => s.id === seasonId);
  if (!season || season.status === "draft") return [];
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
  if (!result.done) return [];
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) };
  const plan = promotionPlan(result.matches, input.leagues, (id) => rating.get(id) ?? 0);
  const growth = new Map(seasonProgression(result.matches, result.titles, leagues, plan).map((r) => [r.idolId, r.new - r.old]));
  const badges = new Map<string, number>();
  for (const b of await listAchievements(db)) if (b.seasonId === seasonId) badges.set(b.idolId, (badges.get(b.idolId) ?? 0) + 1);
  return seasonAwards(result.matches, result.titles, growth, badges);
}
