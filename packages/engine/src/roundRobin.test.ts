import { describe, expect, it } from "vitest";
import { roundRobin } from "./roundRobin";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `i${i + 1}`);

function check(n: number, double: boolean) {
  const rounds = roundRobin(ids(n), { double });
  const pairs = new Map<string, number>();
  const home = new Map<string, number>();
  for (const round of rounds) {
    const seen = new Set<string>();
    for (const [h, a] of round) {
      expect(seen.has(h) || seen.has(a)).toBe(false); // nobody plays twice in a matchday
      seen.add(h).add(a);
      const key = [h, a].sort().join("|");
      pairs.set(key, (pairs.get(key) ?? 0) + 1);
      home.set(h, (home.get(h) ?? 0) + 1);
    }
    expect(seen.size).toBe(n); // everybody plays every matchday
  }
  return { rounds, pairs, home };
}

describe("round robin (PRD §4, acceptance §5.10)", () => {
  it("20-idol double round robin: 38 matchdays × 10 = 380, every pair exactly twice, 19 home + 19 away", () => {
    const { rounds, pairs, home } = check(20, true);
    expect(rounds.length).toBe(38);
    expect(rounds.flat().length).toBe(380);
    expect(pairs.size).toBe(190);
    expect([...pairs.values()].every((c) => c === 2)).toBe(true);
    expect(ids(20).every((id) => home.get(id) === 19)).toBe(true);
  });

  it("each pair plays once at home and once away", () => {
    const fixtures = new Set(roundRobin(ids(20), { double: true }).flat().map(([h, a]) => `${h}>${a}`));
    expect(fixtures.size).toBe(380);
  });

  it("single round robin (LCQ 6, Unzure group 4): every pair once, home/away within one", () => {
    for (const n of [4, 6]) {
      const { rounds, pairs, home } = check(n, false);
      expect(rounds.length).toBe(n - 1);
      expect(pairs.size).toBe((n * (n - 1)) / 2);
      expect([...pairs.values()].every((c) => c === 1)).toBe(true);
      for (const id of ids(n)) expect(Math.abs(2 * (home.get(id) ?? 0) - (n - 1))).toBeLessThanOrEqual(1);
    }
  });

  it("rejects an odd or duplicate roster instead of guessing", () => {
    expect(() => roundRobin(ids(5), { double: false })).toThrow();
    expect(() => roundRobin(["a", "a", "b", "c"], { double: false })).toThrow();
  });
});
