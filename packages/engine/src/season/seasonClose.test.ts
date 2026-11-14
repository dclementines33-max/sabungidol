import { describe, expect, it } from "vitest";
import { runSeason } from "./runSeason";
import { gainFactor, promotionPlan, seasonPoints, seasonProgression } from "./seasonClose";
import { testSeason } from "./testRoster";

const input = testSeason();
const season = runSeason(input);
const rating = (id: string) => input.idols.find((i) => i.id === id)!.rating;
const leagues = { ...input.leagues, IDL: [...new Set(season.matches.filter((m) => m.comp === "IDL" && m.stage === "LG").flatMap((m) => [m.idolA, m.idolB]))] } as Record<string, string[]>;

describe("season close (PRD §6.2–6.3, §4)", () => {
  it("promotes D2 1–3 and relegates D1 18–20 of the paired league", () => {
    const plan = promotionPlan(season.matches, input.leagues, rating);
    expect(plan.promoted).toHaveLength(18);
    expect(plan.relegated).toHaveLength(18);
    for (const [comp, ids] of Object.entries(plan.leagues)) expect(new Set(ids).size, comp).toBe(20);
    expect(plan.leagues.D1A).toEqual(expect.arrayContaining(plan.promoted.slice(0, 3)));
    expect(plan.leagues.D2A).toEqual(expect.arrayContaining(plan.relegated.slice(0, 3)));
  });

  it("gives knockout points by the round an idol went out in; ties share the average", () => {
    const nugu = season.titles.NUG!;
    const points = seasonPoints(season.matches.filter((m) => m.comp === "NUG"), { NUG: nugu }, {}, rating);
    expect(points.get(nugu.champion)).toBeCloseTo(100 * 0.6); // Update 3 prestige: Nugu 0.6
    expect(points.get(nugu.runnerUp)).toBeCloseTo(70 * 0.6);
    const sfLosers = season.matches.filter((m) => m.comp === "NUG" && m.round === "SF").map((m) => (m.result === "A" ? m.idolB : m.idolA));
    for (const id of sfLosers) expect(points.get(id)).toBeCloseTo(50 * 0.6); // no 3rd-place match
  });

  it("moves ratings within the limits, the same way every time", () => {
    const plan = promotionPlan(season.matches, input.leagues, rating);
    const rows = seasonProgression(season.matches, season.titles, leagues, plan);
    expect(rows.length).toBeGreaterThan(200);
    for (const r of rows) {
      expect(r.new).toBeGreaterThanOrEqual(1);
      expect(r.new).toBeLessThanOrEqual(100);
      expect(r.new - r.old).toBeLessThanOrEqual(Math.ceil((6 + 5 + 2 + 2) * 1.6)); // performance + titles + upsets + promotion, ×1.6 at most
      expect(r.old - r.new).toBeLessThanOrEqual(6 + 2 + 1); // a loss: performance + relegation + rounding
    }
    const champ = rows.find((r) => r.idolId === season.titles.UZC!.champion)!;
    expect(champ.reason).toMatch(/titles \+\d/);
    // A gain is scaled by the rating it was played with (gainFactor, 2026-11-15 curve)
    const gains = rows.filter((r) => r.reason.includes("×")).map((r) => ({ old: r.old, factor: Number(/× ([\d.]+)/.exec(r.reason)![1]) }));
    for (const g of gains) expect(g.factor).toBe(Number(gainFactor(g.old).toFixed(2))); // the reason shows 2 decimals
    expect(gains.some((g) => g.old >= 85 && g.factor <= 0.5)).toBe(true);
    expect(gains.some((g) => g.old < 70 && g.factor > 1)).toBe(true);
    expect(seasonProgression(season.matches, season.titles, leagues, plan)).toEqual(rows);
  });
});
