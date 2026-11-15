// What Season Story and the Simulation Timeline need from earlier seasons: who already won which title (so "first title"
// means first ever), each idol's title count, and the most league points one idol made (the IDL league is not counted).
import { type Db, leagueTotals, listPlacements, listSeasons } from "@sabung/db";
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";

export async function storyContext(db: Db, seasonId: string) {
  const seasons = await listSeasons(db);
  const season = seasons.find((s) => s.id === seasonId);
  const earlier = new Set(seasons.filter((s) => season && s.number < season.number).map((s) => s.id));
  const won = (await listPlacements(db)).filter((p) => p.finalRank === 1 && earlier.has(p.seasonId));
  const earlierTitles = new Set(won.map((p) => `${p.idolId}|${p.comp}`));
  const titleCount = new Map<string, number>();
  for (const p of won) titleCount.set(p.idolId, (titleCount.get(p.idolId) ?? 0) + 1);
  let best: number | null = earlier.size ? 0 : null;
  for (const id of earlier) for (const comp of [...D1_LEAGUES, ...D2_LEAGUES]) for (const r of await leagueTotals(db, id, comp)) best = Math.max(best!, r.points);
  return { seasons, season, earlier, earlierTitles, titleCount, best };
}
