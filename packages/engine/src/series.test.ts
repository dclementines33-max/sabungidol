import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { gameWinProbability } from "./probability";
import { matchRng } from "./rng";
import { simulateSeries } from "./series";

const run = (n: number, bestOf: 3 | 4 | 5 | 7, ratingA: number, ratingB: number, sigma = 0) =>
  Array.from({ length: n }, (_, i) =>
    simulateSeries({ ratingA, ratingB, bestOf, rng: matchRng("test", `m${i}`), tuning: { sigma } }),
  );

describe("game probability (PRD §5.1)", () => {
  it("matches the PRD table", () => {
    expect(gameWinProbability(50, 50)).toBeCloseTo(0.5, 3);
    expect(gameWinProbability(60, 50)).toBeCloseTo(0.64, 2);
    expect(gameWinProbability(80, 50)).toBeCloseTo(0.85, 2);
  });

  it("acceptance §5.10: 100,000 games at a 10-point gap = 64% ± 0.5% (no variance)", () => {
    let games = 0;
    let winsA = 0;
    for (const s of run(30_000, 7, 60, 50)) {
      games += s.games.length;
      winsA += s.scoreA;
    }
    expect(games).toBeGreaterThan(100_000);
    expect(Math.abs(winsA / games - 0.6401)).toBeLessThan(0.005);
  });

  it("series odds match the PRD table at a 10-point gap", () => {
    const share = (n: number, bestOf: 3 | 4 | 5 | 7, r: "A" | "D") => run(n, bestOf, 60, 50).filter((s) => s.result === r).length / n;
    expect(share(20_000, 3, "A")).toBeCloseTo(0.7, 1);
    expect(share(20_000, 5, "A")).toBeCloseTo(0.75, 1);
    expect(share(20_000, 4, "D")).toBeCloseTo(0.32, 1);
  });

  it("variance lowers the favourite's odds a little", () => {
    const winRate = (sigma: number) => run(20_000, 5, 60, 50, sigma).filter((s) => s.result === "A").length / 20_000;
    expect(winRate(4)).toBeLessThan(winRate(0));
  });
});

describe("series rules (PRD §5.3)", () => {
  it("always ends exactly when the format says, and only Bo4 can draw 2–2", () => {
    fc.assert(
      fc.property(fc.constantFrom(3, 4, 5, 7), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), fc.string(),
        (bestOf, ratingA, ratingB, id) => {
          const s = simulateSeries({ ratingA, ratingB, bestOf: bestOf as 3 | 4 | 5 | 7, rng: matchRng("p", id) });
          const target = bestOf === 4 ? 3 : (bestOf + 1) / 2;
          expect(s.scoreA + s.scoreB).toBe(s.games.length);
          expect(s.games.filter((g) => g === "A").length).toBe(s.scoreA);
          if (s.result === "D") expect([bestOf, s.scoreA, s.scoreB]).toEqual([4, 2, 2]);
          else expect(Math.max(s.scoreA, s.scoreB)).toBe(target);
          expect(s.result === "A").toBe(s.scoreA === target);
        }),
      { numRuns: 2000 },
    );
  });

  it("is deterministic for the same rng", () => {
    const a = simulateSeries({ ratingA: 70, ratingB: 65, formA: 2, bestOf: 5, rng: matchRng("s", "x") });
    const b = simulateSeries({ ratingA: 70, ratingB: 65, formA: 2, bestOf: 5, rng: matchRng("s", "x") });
    expect(a).toEqual(b);
  });
});
