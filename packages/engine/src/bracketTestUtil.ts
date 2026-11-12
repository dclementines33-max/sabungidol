// Test helper: plays a bracket many times with random winners and checks the basic rules.
import { type BracketMatch, type BracketResult, runBracket } from "./bracket";
import { matchRng } from "./rng";

export function playRandom(template: BracketMatch[], entrants: number, sims = 500) {
  const ids = Array.from({ length: entrants }, (_, i) => `seed${i + 1}`);
  const runs: BracketResult[][] = [];
  for (let s = 0; s < sims; s++) {
    const rng = matchRng("bracket", `sim${s}`);
    runs.push(runBracket(template, ids, () => (rng.next() < 0.5 ? "A" : "B")));
  }
  return { ids, runs };
}

export function lossCounts(results: BracketResult[]): Map<string, number> {
  const losses = new Map<string, number>();
  for (const r of results) if (r.round !== "3RD") losses.set(r.loser, (losses.get(r.loser) ?? 0) + 1);
  return losses;
}
