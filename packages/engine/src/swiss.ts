// Runs one Swiss group to the end: pair a round, play it, repeat until everyone has 3 wins or 3 losses.
import type { Rng } from "./rng";
import { type Pair, type SwissMatch, type SwissRecord, swissPairings, swissRecords } from "./swissPairing";

// rounds = pairs per round; matches = the same rounds with their winners (for the Swiss grid and archive).
export type SwissGroupResult = { rounds: Pair[][]; matches: SwissMatch[][]; records: Map<string, SwissRecord>; fallbackRounds: number[] };

export function runSwiss(seededIds: string[], rng: Rng, play: (a: string, b: string) => "A" | "B"): SwissGroupResult {
  const matches: SwissMatch[][] = [];
  const rounds: Pair[][] = [];
  const fallbackRounds: number[] = [];
  for (;;) {
    const records = swissRecords(seededIds, matches.flat());
    if ([...records.values()].every((r) => r.wins === 3 || r.losses === 3)) return { rounds, matches, records, fallbackRounds };
    const { pairs, fallback } = swissPairings(seededIds, matches.flat(), rng);
    if (fallback) fallbackRounds.push(rounds.length + 1);
    matches.push(pairs.map(([a, b]) => ({ a, b, winner: play(a, b) === "A" ? a : b })));
    rounds.push(pairs);
  }
}
