import { readFileSync } from "node:fs";
import { promotionPlan, seasonProgression, syntheticSeasons } from "@sabung/engine";
import { describe, expect, it } from "vitest";
import { careerTargets, percentileRating, rankTargets } from "./careerTargets";

const seed = (JSON.parse(readFileSync(new URL("../../../../seed/idols.json", import.meta.url), "utf8")) as { idols: { rating?: number | null }[] }).idols
  .map((i) => i.rating ?? 75).slice(0, 240);
const band = (r: number) => (r >= 90 ? "90+" : r >= 86 ? "86-89" : r >= 75 ? "75-85" : r >= 65 ? "65-74" : "<65");
const bands = (m: Map<string, number>) => {
  const out: Record<string, number> = { "<65": 0, "65-74": 0, "75-85": 0, "86-89": 0, "90+": 0 };
  for (const r of m.values()) out[band(Math.round(r))]!++;
  return out;
};

describe("Sync from career stats targets", () => {
  it("the curve: rises with rank, middle 76, 90+ only for the top 2–3%", () => {
    const ps = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.97, 0.99, 1];
    const rs = ps.map(percentileRating);
    expect(rs.every((r, i) => i === 0 || r > rs[i - 1]!)).toBe(true);
    expect(percentileRating(0.5)).toBe(76);
    expect(percentileRating(0.96)).toBeLessThan(90);
    expect(percentileRating(1)).toBeLessThanOrEqual(96);
  });

  it("career totals from 10 simulated seasons: far fewer at 90+ than the old even spread", () => {
    const totals = new Map<string, number>();
    const seasons = [...syntheticSeasons(10, "career", seed)];
    seasons.reverse().forEach((s, age) => { // newest weight 1.0, 15% less per season back, like careerSync
      const rating = new Map(s.input.idols.map((i) => [i.id, i.rating]));
      const leagues = { ...s.input.leagues, IDL: s.input.theIdols } as Record<string, string[]>;
      const rows = seasonProgression(s.result.matches, s.result.titles, leagues, promotionPlan(s.result.matches, s.input.leagues, (id) => rating.get(id)!));
      for (const r of rows) totals.set(r.idolId, (totals.get(r.idolId) ?? 0) + r.score * 0.85 ** age);
    });
    const before = bands(rankTargets(totals));
    const after = bands(careerTargets(totals));
    console.log("career sync bands before", before, "after", after);
    expect(before["90+"]).toBeGreaterThan(30); // the old mapping: ~15% at 90+
    expect(after["90+"]).toBeLessThanOrEqual(8); // now: only the top 2–3%
    expect(after["75-85"]! + after["65-74"]!).toBeGreaterThan(150);
  }, 300_000);
});
