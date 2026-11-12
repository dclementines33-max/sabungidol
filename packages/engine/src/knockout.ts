// Single-elimination template (PRD §4). entriesPerRound[r] = new idols entering round r+1,
// e.g. [16] for B-Side, [32] for Unzure KO, [120, 44, 76] for Nugu. Seeds are numbered in
// entry order. Newcomers meet last round's winners first; any rest pair up in order.
import type { BracketMatch, Source } from "./bracket";

// 1 v 16, 8 v 9, ... so seeds 1 and 2 can only meet in the final.
export function standardSeedOrder(size: number): number[] {
  if (size === 2) return [1, 2];
  return standardSeedOrder(size / 2).flatMap((s) => [s, size + 1 - s]);
}

// pairing "order": newcomers meet winners in list order (Unzure KO, pairs already drawn).
// pairing "seed": by rank (Nugu Cup). Each round's newcomers are listed best first, and a later
// entry round counts as stronger (longer bye). Best newcomer v weakest expected winner, then
// the rest best v worst — so the two best idols can only meet in the final.
export function knockoutTemplate(
  entriesPerRound: number[],
  { thirdPlace = false, pairing = "order" }: { thirdPlace?: boolean; pairing?: "order" | "seed" } = {},
): BracketMatch[] {
  // Pass 1: how many rounds, and is every round even?
  let roundCount = 0;
  for (let alive = 0; alive + (entriesPerRound[roundCount] ?? 0) > 1; roundCount++) {
    const n = alive + (entriesPerRound[roundCount] ?? 0);
    if (n % 2 !== 0) throw new Error(`Round ${roundCount + 1} would have an odd number of idols (${n})`);
    alive = n / 2;
  }
  const isFinal = (r: number) => r === roundCount - 1;
  const roundName = (r: number) => ["F", "SF", "QF"][roundCount - 1 - r] ?? `R${r + 1}`;
  const keyOf = (r: number, slot: number) => `${isFinal(r) ? "FN" : "KO"}-${roundName(r)}-${slot}`;

  // Pass 2: build the matches. strength: lower = expected stronger (only used for "seed").
  const matches: BracketMatch[] = [];
  const strength = new Map<Source, number>();
  let winners: Source[] = [];
  let nextSeed = 1;
  for (let r = 0; r < roundCount; r++) {
    const newcomers: Source[] = Array.from({ length: entriesPerRound[r] ?? 0 }, (_, i) => {
      const source = { seed: nextSeed++ };
      strength.set(source, (roundCount - r) * 100_000 + i);
      return source;
    });
    const byStrength = (x: Source, y: Source) => strength.get(x)! - strength.get(y)!;
    const opponents = pairing === "seed" ? [...winners].sort(byStrength).reverse() : winners; // weakest first
    const paired = Math.min(opponents.length, newcomers.length);
    const pairs: [Source, Source][] = newcomers.slice(0, paired).map((n, i) => [n, opponents[i]]);
    const rest = [...newcomers.slice(paired), ...opponents.slice(paired)];
    if (pairing === "seed") {
      rest.sort(byStrength);
      for (let i = 0; i < rest.length / 2; i++) pairs.push([rest[i], rest[rest.length - 1 - i]]);
    } else {
      for (let i = 0; i < rest.length; i += 2) pairs.push([rest[i], rest[i + 1]]);
    }
    winners = pairs.map(([a, b], i) => {
      matches.push({ key: keyOf(r, i + 1), stage: isFinal(r) ? "FN" : "KO", round: roundName(r), slot: i + 1, a, b });
      const winner = { winner: keyOf(r, i + 1) };
      strength.set(winner, Math.min(strength.get(a) ?? 0, strength.get(b) ?? 0));
      return winner;
    });
  }
  if (thirdPlace) {
    const third: BracketMatch = { key: "FN-3RD-1", stage: "FN", round: "3RD", slot: 1, a: { loser: "KO-SF-1" }, b: { loser: "KO-SF-2" } };
    matches.splice(matches.length - 1, 0, third);
  }
  return matches;
}
