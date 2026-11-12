// Round robin schedule by the circle method (PRD §4). Returns matchdays of [home, away] pairs.
// double = second half repeats the first with home and away swapped (20 idols → 38 matchdays).
export type Fixture = [home: string, away: string];

export function roundRobin(idolIds: string[], { double }: { double: boolean }): Fixture[][] {
  const n = idolIds.length;
  if (n < 2 || n % 2 !== 0) throw new Error(`Round robin needs an even number of idols, got ${n}`);
  if (new Set(idolIds).size !== n) throw new Error("Round robin roster has a duplicate idol");

  const [fixed, ...others] = idolIds;
  const firstHalf: Fixture[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const circle = [fixed, ...others.slice(r), ...others.slice(0, r)];
    const round: Fixture[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = circle[i];
      const b = circle[n - 1 - i];
      // Fixed idol alternates by matchday; other pairs alternate by position, so every idol's
      // home and away count differ by at most one.
      const aIsHome = i === 0 ? r % 2 === 0 : i % 2 === 1;
      round.push(aIsHome ? [a, b] : [b, a]);
    }
    firstHalf.push(round);
  }
  if (!double) return firstHalf;
  return [...firstHalf, ...firstHalf.map((round) => round.map(([h, a]): Fixture => [a, h]))];
}
