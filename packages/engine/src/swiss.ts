// Runs one Swiss group to the end: pair a round, play it, repeat until everyone has 3 wins or 3 losses.
import type { Rng } from "./rng";
import { type Pair, type SwissMatch, type SwissRecord, swissPairings, swissRecords } from "./swissPairing";

export type SwissGroupResult = { rounds: Pair[][]; records: Map<string, SwissRecord>; fallbackRounds: number[] };

export function runSwiss(seededIds: string[], rng: Rng, play: (a: string, b: string) => "A" | "B"): SwissGroupResult {
  const history: SwissMatch[] = [];
  const rounds: Pair[][] = [];
  const fallbackRounds: number[] = [];
  for (;;) {
    const records = swissRecords(seededIds, history);
    if ([...records.values()].every((r) => r.wins === 3 || r.losses === 3)) return { rounds, records, fallbackRounds };
    const { pairs, fallback } = swissPairings(seededIds, history, rng);
    if (fallback) fallbackRounds.push(rounds.length + 1);
    for (const [a, b] of pairs) history.push({ a, b, winner: play(a, b) === "A" ? a : b });
    rounds.push(pairs);
  }
}
