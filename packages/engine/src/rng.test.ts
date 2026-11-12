import { describe, expect, it } from "vitest";
import { matchRng } from "./rng";

const take = (rng: { next(): number }, n: number) => Array.from({ length: n }, () => rng.next());

describe("seeded rng", () => {
  it("same season seed + match id gives the same numbers", () => {
    expect(take(matchRng("s1", "S01-D1A-LG-MD01-M01"), 20)).toEqual(take(matchRng("s1", "S01-D1A-LG-MD01-M01"), 20));
  });

  it("a different match, season seed or re-roll salt gives different numbers", () => {
    const base = take(matchRng("s1", "S01-D1A-LG-MD01-M01"), 5);
    expect(take(matchRng("s1", "S01-D1A-LG-MD01-M02"), 5)).not.toEqual(base);
    expect(take(matchRng("s2", "S01-D1A-LG-MD01-M01"), 5)).not.toEqual(base);
    expect(take(matchRng("s1", "S01-D1A-LG-MD01-M01", 1), 5)).not.toEqual(base);
  });

  it("next() is uniform in [0, 1)", () => {
    const xs = take(matchRng("s1", "uniform"), 100_000);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(xs.reduce((a, b) => a + b, 0) / xs.length).toBeCloseTo(0.5, 2);
  });

  it("normal(sigma) has mean 0 and the given spread", () => {
    const rng = matchRng("s1", "normal");
    const xs = Array.from({ length: 100_000 }, () => rng.normal(4));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(Math.abs(sd - 4)).toBeLessThan(0.05);
  });
});
