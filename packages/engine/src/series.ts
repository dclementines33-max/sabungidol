// Plays one Best-of-N series game by game (PRD §5.3).
import type { BestOf } from "@sabung/shared";
import { gameWinProbability } from "./probability";
import type { Rng } from "./rng";

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
  const target = bestOf === 4 ? 3 : (bestOf + 1) / 2;

  const games: ("A" | "B")[] = [];
  let scoreA = 0;
  let scoreB = 0;
  while (scoreA < target && scoreB < target && games.length < bestOf) {
    const winner = rng.next() < p ? "A" : "B";
    games.push(winner);
    if (winner === "A") scoreA++;
    else scoreB++;
  }
  const result = scoreA === target ? "A" : scoreB === target ? "B" : "D"; // D only possible as Bo4 2–2
  return { games, scoreA, scoreB, result };
}
