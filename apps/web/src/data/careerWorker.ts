// Career stats in the Worker (PRD §7.1–7.2): every finished season (archived, or live and complete) is
// folded once, in season order, into the stats cache and gets its placements written. Reading adds the
// live season's matches on top (its placements come when it finishes). "Rebuild Stats" folds everything
// again from zero; the Fase 4 gate checks both give the same.
import { type Db, type SeasonRow, listSeasons, readCache, replaceAchievements, replacePlacements, writeCache } from "@sabung/db";
import {
  type AchievementState, type CareerState, type MatchRecords, careerRows, emptyAchievements, foldMatchRecords, foldSeason, promotionPlan, runSeason,
  seasonAchievements, seasonPlacements, seasonProgression,
} from "@sabung/engine";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

type Cache = { seasons: string[]; state: CareerState; records: MatchRecords; achievements: AchievementState };
const KEY = "career";

async function replay(db: Db, season: SeasonRow) {
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await seasonMatches(db, season.id), target: () => false });
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) } as Record<string, string[]>;
  if (!result.done) return { result, placements: [], scores: new Map<string, number>() };
  const plan = promotionPlan(result.matches, input.leagues, (id) => rating.get(id) ?? 0);
  const scores = new Map(seasonProgression(result.matches, result.titles, leagues, plan).map((r) => [r.idolId, r.score])); // §6.2 season score
  return { result, placements: seasonPlacements(result.matches, result.titles, leagues, (id) => rating.get(id) ?? 0), scores };
}

// Folds the finished seasons the cache does not have yet; with rebuild, all of them from zero.
export async function updateCareerCache(db: Db, rebuild = false): Promise<Cache & { live: SeasonRow | null }> {
  const seasons = (await listSeasons(db)).filter((s) => s.status === "live" || s.status === "archived").sort((a, b) => a.number - b.number);
  const stored = rebuild ? undefined : await readCache<Cache>(db, KEY);
  let cache: Cache = stored?.achievements ? stored : { seasons: [], state: {}, records: { pairs: {}, upsets: [] }, achievements: emptyAchievements() }; // an older cache shape is rebuilt
  let live: SeasonRow | null = null;
  let changed = rebuild || !stored?.achievements;
  for (const season of seasons) {
    if (cache.seasons.includes(season.id)) continue;
    const { result, placements, scores } = await replay(db, season);
    if (!result.done) { live = season; break; } // only the last season can be unfinished
    await replacePlacements(db, season.id, placements);
    const state = foldSeason(cache.state, season.number, result.matches, placements);
    const badges = seasonAchievements(cache.achievements, season.number, placements, cache.state, state, scores);
    await replaceAchievements(db, season.id, badges.badges);
    cache = { seasons: [...cache.seasons, season.id], state, records: foldMatchRecords(cache.records, season.number, result.matches), achievements: badges.state };
    changed = true;
  }
  if (changed) await writeCache(db, KEY, "career", cache, cache.seasons.length);
  return { ...cache, live };
}

// Career rows, head-to-head per pair and the biggest upsets, the live season included.
export async function careerStats(db: Db) {
  const { state, records, live } = await updateCareerCache(db);
  if (!live) return { rows: careerRows(state), ...records };
  const { result } = await replay(db, live);
  return { rows: careerRows(foldSeason(state, live.number, result.matches, [])), ...foldMatchRecords(records, live.number, result.matches) };
}

export const rebuildStats = async (db: Db) => (await updateCareerCache(db, true)).seasons.length;
