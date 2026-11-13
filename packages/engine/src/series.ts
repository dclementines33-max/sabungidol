// Plays one Best-of-N series game by game (PRD §5.3).
import type { BestOf } from "@sabung/shared";
import { gameWinProbability } from "./probability";
import type { Rng } from "./rng";
import { type Side, seriesState } from "./seriesRules";

export type Tuning = { scale?: number; sigma?: number }; // defaults 40 and 4 (PRD §5.1)

export type SeriesInput = {
  ratingA: number;
  ratingB: number;
  formA?: number; // form modifier
  formB?: number;
  bestOf: BestOf;
  rng: Rng;
  tuning?: Tuning;
};

export type SeriesResult = { games: ("A" | "B")[]; scoreA: number; scoreB: number; result: "A" | "B" | "D" };

export function simulateSeries({ ratingA, ratingB, formA = 0, formB = 0, bestOf, rng, tuning = {} }: SeriesInput): SeriesResult {
  const { scale = 40, sigma = 4 } = tuning;
  // Variance is drawn once per idol per match, so a "bad day" lasts the whole series.
  const effectiveA = ratingA + formA + rng.normal(sigma);
  const effectiveB = ratingB + formB + rng.normal(sigma);
  const p = gameWinProbability(effectiveA, effectiveB, scale);

  // Update 3 tweak: the side behind in the series fights back a little (+3% per game behind, at most +6%),
  // so comebacks and close series happen a bit more often; the better idol still wins most of them.
  const games: Side[] = [];
  for (let state = seriesState(bestOf, games); !state.result; state = seriesState(bestOf, games)) {
    const push = Math.max(-0.06, Math.min(0.06, 0.03 * (state.scoreB - state.scoreA)));
    games.push(rng.next() < p + push ? "A" : "B");
  }
  const { scoreA, scoreB, result } = seriesState(bestOf, games);
  return { games, scoreA, scoreB, result: result! };
}
