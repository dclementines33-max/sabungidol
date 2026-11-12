// Nugu Cup entry solver (PRD §5.9, user decision: D1 byes of 1–2 rounds).
// All D2 idols enter round 1; D1 idols enter round 2 or 3 so that round 3 holds exactly
// 2^(rounds - 2) idols. Returns new entrants per round, e.g. 120/120/9 → [120, 44, 76].
// The caller puts the higher-ranked D1 idols in round 3 (the longer bye).
export function nuguEntryPlan(d2: number, d1: number, rounds: number): number[] {
  const round3Size = 2 ** (rounds - 2);
  // Round 3 = (d2/2 + inRound2)/2 + inRound3, and inRound2 + inRound3 = d1.
  const inRound2 = d2 / 2 + 2 * (d1 - round3Size);
  const inRound3 = d1 - inRound2;
  const round2Size = d2 / 2 + inRound2;
  if (d2 % 2 !== 0 || inRound2 < 0 || inRound3 < 0 || round2Size % 2 !== 0) {
    throw new Error(`Nugu Cup cannot fit ${d2} D2 + ${d1} D1 idols into ${rounds} even rounds`);
  }
  return [d2, inRound2, inRound3];
}
