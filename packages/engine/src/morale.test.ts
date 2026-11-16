import { describe, expect, it } from "vitest";
import { MAX_EFFECT, MORALE_MAX, moraleAfter, moraleModifier, moraleName, moraleTrack } from "./morale";
import { gameWinProbability } from "./probability";
import { matchRng } from "./rng";
import type { SimMatch } from "./season/types";

const m = (over: Partial<SimMatch> = {}) =>
  ({ id: "x", comp: "D1A", stage: "LG", round: "MD01", slot: 1, idolA: "a", idolB: "b", games: [], scoreA: 2, scoreB: 1, result: "A", ratingA: 80, ratingB: 80, formA: "", formB: "", ...over }) as SimMatch;

describe("morale", () => {
  it("never leaves ±MORALE_MAX and is never worth more than ±MAX_EFFECT rating points, whatever happens", () => {
    const r = matchRng("morale", "bounds");
    const rng = () => r.next();
    let morale = 0;
    for (let i = 0; i < 5000; i++) {
      const win = rng() < 0.5;
      morale = moraleAfter(morale, m({ result: win ? "A" : "B", scoreA: win ? 3 : 0, scoreB: win ? 0 : 3, ratingB: 80 + Math.round((rng() - 0.5) * 40), round: rng() < 0.1 ? "F" : "MD01" }), "A");
      expect(Math.abs(morale)).toBeLessThanOrEqual(MORALE_MAX);
      expect(Math.abs(moraleModifier(morale))).toBeLessThanOrEqual(MAX_EFFECT);
    }
    expect(moraleModifier(99)).toBe(MAX_EFFECT);
    expect(moraleModifier(-99)).toBe(-MAX_EFFECT);
  });

  it("upper limit on the win chance: best against worst morale moves one game by under 6 percentage points", () => {
    const shift = gameWinProbability(80 + moraleModifier(MORALE_MAX), 80 + moraleModifier(-MORALE_MAX)) - 0.5;
    expect(shift).toBeGreaterThan(0);
    expect(shift).toBeLessThan(0.06);
  });

  it("builds on a winning run, more for an upset or a final, and fades", () => {
    let run = 0;
    for (let i = 0; i < 6; i++) run = moraleAfter(run, m(), "A");
    expect(run).toBeGreaterThan(3);
    expect(moraleName(run)).toBe("Buoyant");
    expect(moraleAfter(0, m({ ratingA: 70, ratingB: 85 }), "A")).toBe(3); // an upset win
    expect(moraleAfter(0, m({ round: "F", scoreA: 3, scoreB: 0 }), "A")).toBe(5); // a final won in a sweep
    expect(moraleAfter(0, m({ round: "F", scoreA: 3, scoreB: 0 }), "B")).toBe(-4);
    expect(moraleAfter(4, m({ result: "D", scoreA: 1, scoreB: 1 }), "A")).toBeCloseTo(3.4); // a draw only fades it
  });

  it("track: every idol's morale after the season so far", () => {
    const t = moraleTrack([m(), m({ idolA: "b", idolB: "c", result: "B", scoreA: 0, scoreB: 2 })]);
    expect(t.get("a")).toBe(1);
    expect(t.get("b")).toBeCloseTo(-1 * 0.85 - 2); // lost, then swept
    expect(moraleName(t.get("b")!)).toBe("Shaken");
  });
});
