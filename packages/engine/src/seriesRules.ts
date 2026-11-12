// When a Best-of-N series is over, and which final scores are possible (PRD §5.3).
// Bo3/5/7: first to 2/3/4. Bo4: first to 3, or 2–2 = draw.
import type { BestOf } from "@sabung/shared";
import { gameWinProbability } from "./probability";

export type Side = "A" | "B";

export const seriesTarget = (bestOf: BestOf) => (bestOf === 4 ? 3 : (bestOf + 1) / 2);

export function seriesState(bestOf: BestOf, games: Side[]) {
  const target = seriesTarget(bestOf);
  const scoreA = games.filter((g) => g === "A").length;
  const scoreB = games.length - scoreA;
  const result: Side | "D" | null =
    scoreA >= target ? "A" : scoreB >= target ? "B" : games.length === bestOf ? "D" : null; // D: only Bo4 2–2
  return { scoreA, scoreB, result };
}

// A score a series can end on, for manual entry (PRD §9 MatchModal).
export function isFinalScore(bestOf: BestOf, scoreA: number, scoreB: number): boolean {
  const target = seriesTarget(bestOf);
  if (scoreA === target) return scoreB >= 0 && scoreB < target;
  if (scoreB === target) return scoreA >= 0 && scoreA < target;
  return bestOf === 4 && scoreA === 2 && scoreB === 2;
}

// Exact chance of each result before the match (no variance), for the match screen (PRD §5.1 table).
export function seriesOdds(effectiveA: number, effectiveB: number, bestOf: BestOf, scale = 40): Record<Side | "D", number> {
  const p = gameWinProbability(effectiveA, effectiveB, scale);
  const odds = { A: 0, B: 0, D: 0 };
  const walk = (games: Side[], chance: number) => {
    const { result } = seriesState(bestOf, games);
    if (result) {
      odds[result] += chance;
      return;
    }
    walk([...games, "A"], chance * p);
    walk([...games, "B"], chance * (1 - p));
  };
  walk([], 1);
  return odds;
}
