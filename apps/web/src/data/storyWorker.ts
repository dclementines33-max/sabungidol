// Season Story in the Worker (PRD §8): the season replayed from its saved matches (nothing is played), and
// the titles of earlier seasons, so "first title" means first ever.
import { type Db, countMatchesWhere, listIdols, listPlacements } from "@sabung/db";
import { type Placed, careerNews, runSeason, seasonDrama, seasonMoments, seasonNews, seasonPlacements, seasonStory, topPairs, trajectoryNews } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";
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
  // Career trajectories: every placement up to this season (this season's from the replay), only once the season is finished.
  const number = new Map(ctx.seasons.map((s) => [s.id, s.number]));
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) } as Record<string, string[]>;
  const rows: Placed[] = !result.done ? [] : [
    ...(await listPlacements(db)).filter((p) => earlier.has(p.seasonId)).map((p) => ({ season: number.get(p.seasonId)!, idolId: p.idolId, comp: p.comp, finalRank: p.finalRank, stage: p.stageReached })),
    ...seasonPlacements(result.matches, result.titles, leagues, (id) => rating.get(id) ?? 0).map((p) => ({ season: season.number, idolId: p.idolId, comp: p.comp, finalRank: p.finalRank, stage: p.stageReached })),
  ];
  return [...drama, ...news, ...moments, ...careerNews(pairs, gone), ...trajectoryNews(rows, season.number, (id) => rating.get(id) ?? 0), ...(earlier.size ? stories : stories.filter((s) => s.kind !== "first-title"))]; // in the first season every title is a first
}
