// Test helper: many seasons in a row, the way the app plays them (Fase 4 gate: 20 synthetic seasons).
// Each season: replay → places → promotion/relegation and Season Progression feed the next season.
import { pickTheIdols } from "./leaguePhase";
import { type Placement, seasonPlacements } from "./placements";
import { runSeason } from "./runSeason";
import { promotionPlan, seasonProgression } from "./seasonClose";
import { testSeason } from "./testRoster";
import type { SeasonInput, SeasonResult } from "./types";

export type SyntheticSeason = { input: SeasonInput & { theIdols: string[] }; result: SeasonResult; placements: Placement[] };

export function* syntheticSeasons(count: number, seed = "synthetic"): Generator<SyntheticSeason> {
  let input: SeasonInput = testSeason(seed, 1);
  for (let n = 1; n <= count; n++) {
    const theIdols = pickTheIdols(input);
    const full = { ...input, season: n, seed: `${seed}-${n}`, theIdols };
    const result = runSeason(full);
    const rating = new Map(full.idols.map((i) => [i.id, i.rating]));
    const leagues = { ...full.leagues, IDL: theIdols } as Record<string, string[]>;
    const placements = seasonPlacements(result.matches, result.titles, leagues, (id) => rating.get(id)!);
    yield { input: full, result, placements };
    const plan = promotionPlan(result.matches, full.leagues, (id) => rating.get(id)!);
    const next = new Map(seasonProgression(result.matches, result.titles, leagues, plan).map((r) => [r.idolId, r.new]));
    input = { ...full, theIdols: undefined, leagues: plan.leagues as SeasonInput["leagues"], idols: full.idols.map((i) => ({ ...i, rating: next.get(i.id) ?? i.rating })) };
  }
}
