// Season Story in the Worker (PRD §8): the season replayed from its saved matches (nothing is played), and
// the titles of earlier seasons, so "first title" means first ever.
import { type Db, countMatchesWhere, listIdols, listSeasonRatingChanges, listPlacements } from "@sabung/db";
import { careerNews, runSeason, seasonDrama, seasonMoments, seasonNews, seasonStory, topPairs } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";
import { involves, seasonRecord } from "./podiumDetail";
import { storyContext } from "./storyContext";

export async function storyOf(db: Db, seasonId: string) {
  const ctx = await storyContext(db, seasonId);
  const { season, earlier } = ctx;
  if (!season || season.status === "draft") return [];
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
  const stories = seasonStory(result.matches, result.titles, ctx.earlierTitles);
  const drama = seasonDrama(result.matches, ctx.best);
  const news = seasonNews(result.matches, result.titles, ctx.titleCount);
  // Breaking news (2026-11-16): the Simulation Timeline's moments, for the whole season. A champion already told as a first title is left out.
  const firsts = new Set(stories.flatMap((s) => (s.kind === "first-title" ? [`${s.idol}|${s.title}`] : [])));
  const moments = seasonMoments(result.matches, null, result.titles).map((m) => m.story).filter((s) => s.kind !== "champion" || !firsts.has(`${s.idol}|${s.title}`));
  // Rivalries renewed (the season's most-met pairs, counted in earlier seasons) and farewells (only in the newest season:
  // idols now inactive who played before and not now).
  const pairs: [string, string, number, number][] = [];
  for (const [a, b, meetings] of topPairs(result.matches)) {
    let before = 0;
    for (const id of earlier) before += await countMatchesWhere(db, { seasonId: id, idolId: a, vsId: b });
    pairs.push([a, b, meetings, before]);
  }
  const newest = ctx.seasons.filter((s) => s.status !== "draft").every((s) => s.number <= season.number);
  const playing = new Set(result.matches.flatMap((m) => [m.idolA, m.idolB]));
  const gone = newest ? (await listIdols(db)).filter((i) => !i.active && ctx.placedEarlier.has(i.id) && !playing.has(i.id)).map((i) => ({ idol: i.id, titles: ctx.titleCount.get(i.id) ?? 0 })) : [];
  return [...drama, ...news, ...moments, ...careerNews(pairs, gone), ...(earlier.size ? stories : stories.filter((s) => s.kind !== "first-title"))]; // in the first season every title is a first
}

// The season top 3's detail (Season Honours): record, places, rating change and the stories that name them.
export async function podiumOf(db: Db, seasonId: string, ids: string[]) {
  const [matches, places, changes, stories] = await Promise.all([seasonMatches(db, seasonId), listPlacements(db, seasonId), listSeasonRatingChanges(db, seasonId), storyOf(db, seasonId)]);
  return ids.map((id) => ({
    id, record: seasonRecord(matches, id),
    places: places.filter((p) => p.idolId === id).map((p) => ({ comp: p.comp, rank: p.finalRank })).sort((a, b) => a.rank - b.rank || a.comp.localeCompare(b.comp)),
    rating: changes.find((c) => c.idolId === id) ?? null,
    stories: stories.filter((s) => involves(s, id)),
  }));
}
