// Career stats in the Worker (PRD §7.1–7.2): every finished season (archived, or live and complete) is
// folded once, in season order, into the stats cache and gets its placements written. Reading adds the
// live season's matches on top (its placements come when it finishes). "Rebuild Stats" folds everything
// again from zero; the Fase 4 gate checks both give the same.
import { type Db, type SeasonRow, listSeasonMatches, listSeasons, readCache, replacePlacements, writeCache } from "@sabung/db";
import { type CareerState, type MatchRecords, careerRows, foldMatchRecords, foldSeason, runSeason, seasonPlacements } from "@sabung/engine";
import { seasonInput } from "./seasonRunner";

type Cache = { seasons: string[]; state: CareerState; records: MatchRecords };
const KEY = "career";

async function replay(db: Db, season: SeasonRow) {
  const input = await seasonInput(db, season);
  const result = runSeason({ ...input, saved: await listSeasonMatches(db, season.id), target: () => false });
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const leagues = { ...input.leagues, ...(input.theIdols ? { IDL: input.theIdols } : {}) } as Record<string, string[]>;
  return { result, placements: result.done ? seasonPlacements(result.matches, result.titles, leagues, (id) => rating.get(id) ?? 0) : [] };
}

// Folds the finished seasons the cache does not have yet; with rebuild, all of them from zero.
export async function updateCareerCache(db: Db, rebuild = false): Promise<Cache & { live: SeasonRow | null }> {
  const seasons = (await listSeasons(db)).filter((s) => s.status === "live" || s.status === "archived").sort((a, b) => a.number - b.number);
  const stored = rebuild ? undefined : await readCache<Cache>(db, KEY);
  let cache: Cache = stored?.records ? stored : { seasons: [], state: {}, records: { pairs: {}, upsets: [] } }; // an older cache shape is rebuilt
  let live: SeasonRow | null = null;
  let changed = rebuild || !stored?.records;
  for (const season of seasons) {
    if (cache.seasons.includes(season.id)) continue;
    const { result, placements } = await replay(db, season);
    if (!result.done) { live = season; break; } // only the last season can be unfinished
    await replacePlacements(db, season.id, placements);
    cache = {
      seasons: [...cache.seasons, season.id],
      state: foldSeason(cache.state, season.number, result.matches, placements),
      records: foldMatchRecords(cache.records, season.number, result.matches),
    };
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
