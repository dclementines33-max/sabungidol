import { describe, expect, it } from "vitest";
import { isFinalScore, seriesOdds, seriesState } from "./seriesRules";

describe("seriesState (PRD §5.3)", () => {
  it("is open until someone reaches the target", () => {
    expect(seriesState(5, ["A", "B", "A"]).result).toBeNull();
    expect(seriesState(5, ["A", "B", "A", "A"])).toEqual({ scoreA: 3, scoreB: 1, result: "A" });
    expect(seriesState(3, ["B", "B"]).result).toBe("B");
  });
  it("Bo4 can end 2–2, other formats cannot draw", () => {
    expect(seriesState(4, ["A", "B", "B", "A"]).result).toBe("D");
    expect(seriesState(4, ["A", "A", "A"]).result).toBe("A");
  });
});

describe("isFinalScore", () => {
  it.each([[3, 2, 0], [3, 1, 2], [4, 3, 1], [4, 2, 2], [4, 0, 3], [5, 3, 2], [7, 4, 3], [7, 0, 4]])("Bo%i %i–%i is a final score", (bo, a, b) => {
    expect(isFinalScore(bo as 3 | 4 | 5 | 7, a, b)).toBe(true);
  });
  it.each([[3, 1, 1], [3, 2, 2], [5, 2, 2], [5, 3, 3], [7, 4, 4], [4, 3, 3], [4, 1, 1], [5, -1, 3]])("Bo%i %i–%i is not", (bo, a, b) => {
    expect(isFinalScore(bo as 3 | 4 | 5 | 7, a, b)).toBe(false);
  });
});

describe("seriesOdds matches the PRD §5.1 table at a 10-point gap", () => {
  const near = (x: number, target: number) => expect(Math.abs(x - target)).toBeLessThan(0.01);
  it("Bo3 / Bo5 / Bo7", () => {
    near(seriesOdds(60, 50, 3).A, 0.7);
    near(seriesOdds(60, 50, 5).A, 0.75);
    near(seriesOdds(60, 50, 7).A, 0.78);
  });
  it("Bo4 win / draw / loss = 55 / 32 / 14", () => {
    const odds = seriesOdds(60, 50, 4);
    near(odds.A, 0.55);
    near(odds.D, 0.32);
    near(odds.B, 0.14);
    near(odds.A + odds.D + odds.B, 1);
  });
});
