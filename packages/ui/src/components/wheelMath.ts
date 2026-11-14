// The wheel's rules, apart from its look (2026-11-15). Fair by design: one random number per game, below 0.5 = A, so
// every game is 50:50; the rest only reads the series to set the pace and the drama.
import { type Side, seriesState, seriesTarget } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";

export const SEGMENTS = 16;
export const STEP = 360 / SEGMENTS;
export const SPIN_MS = 3200;
export const TENSE_MS = 5200; // match point or a deciding game: a longer, slower spin
export const PAUSE_MS = 900; // between the spins of "Spin all": the winner's moment

// One random number picks the side and where inside one of its segments the pointer stops (even segments are A).
export function landing(r: number): { winner: Side; angle: number } {
  const winner: Side = r < 0.5 ? "A" : "B";
  const x = (winner === "A" ? r * 2 : (r - 0.5) * 2) * (SEGMENTS / 2);
  const k = Math.min(Math.floor(x), SEGMENTS / 2 - 1);
  const segment = k * 2 + (winner === "A" ? 0 : 1);
  return { winner, angle: (segment + 0.2 + 0.6 * (x - k)) * STEP };
}

// Who can still take the series from here, every game 50:50: { A, B, D } (a draw only in Bo4).
export function seriesChance(bestOf: BestOf, games: Side[]): Record<"A" | "B" | "D", number> {
  const target = seriesTarget(bestOf);
  const go = (a: number, b: number, n: number): Record<"A" | "B" | "D", number> => {
    if (a >= target) return { A: 1, B: 0, D: 0 };
    if (b >= target) return { A: 0, B: 1, D: 0 };
    if (n >= bestOf) return { A: 0, B: 0, D: 1 };
    const x = go(a + 1, b, n + 1), y = go(a, b + 1, n + 1);
    return { A: (x.A + y.A) / 2, B: (x.B + y.B) / 2, D: (x.D + y.D) / 2 };
  };
  const { scoreA, scoreB } = seriesState(bestOf, games);
  return go(scoreA, scoreB, games.length);
}

// The next game could end the series for either side (match point), or it is the last game there is.
export function tension(bestOf: BestOf, games: Side[]): "decider" | "match point" | null {
  const { scoreA, scoreB, result } = seriesState(bestOf, games);
  if (result) return null;
  const target = seriesTarget(bestOf);
  if (games.length === bestOf - 1 || (scoreA === target - 1 && scoreB === target - 1)) return "decider";
  return scoreA === target - 1 || scoreB === target - 1 ? "match point" : null;
}

export const spinMs = (bestOf: BestOf, games: Side[]) => (tension(bestOf, games) ? TENSE_MS : SPIN_MS);

// How loud the room is, 0–1: louder when it is close, when the lower-rated idol leads, and at match point.
export function crowd(bestOf: BestOf, games: Side[], ratingA: number, ratingB: number): number {
  const { scoreA, scoreB } = seriesState(bestOf, games);
  const close = 1 - Math.abs(scoreA - scoreB) / seriesTarget(bestOf);
  const underdogLeads = (scoreA > scoreB && ratingA < ratingB) || (scoreB > scoreA && ratingB < ratingA) ? 1 : 0;
  const t = tension(bestOf, games) ? 1 : 0;
  return Math.min(1, 0.15 + 0.35 * close * (games.length ? 1 : 0.3) + 0.3 * underdogLeads + 0.2 * t);
}

// The lower-rated idol took the series by 10+ rating points.
export const isUpset = (result: Side | "D" | null, ratingA: number, ratingB: number) =>
  (result === "A" && ratingB - ratingA >= 10) || (result === "B" && ratingA - ratingB >= 10);
