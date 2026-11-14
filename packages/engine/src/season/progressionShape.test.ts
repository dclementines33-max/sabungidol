// Locks the rating shape that Season Progression grows toward (user 2026-11-15): from the default seed roster, after
// 10 seasons most idols sit in the 70s to mid-80s, the top stays rare and the low bands do not refill.
import { describe, expect, it } from "vitest";
import { gainFactor } from "./seasonClose";
import { syntheticSeasons } from "./synthetic";
import seedFile from "../../../../seed/idols.json";

const seed = (seedFile as { idols: { rating?: number | null }[] }).idols
  .map((i) => i.rating ?? 75).slice(0, 240);

describe("season progression shape", () => {
  it("gains get harder the higher the rating, in bands", () => {
    const f = [60, 70, 80, 86, 90, 95, 100].map(gainFactor);
    expect(f.every((x, i) => i === 0 || x < f[i - 1]!)).toBe(true);
    expect(gainFactor(65)).toBeGreaterThan(1); // below 70: easy
    expect(gainFactor(80)).toBe(1);
    expect(gainFactor(88)).toBeLessThan(0.5); // 86–90: harder
    expect(gainFactor(92)).toBeLessThan(0.2); // 90+: hardest
  });

  it("after 10 seasons from the seed: most idols 70–85, few at 86+, the low bands empty", () => {
    let last: number[] = [];
    for (const s of syntheticSeasons(11, "shape", seed)) last = s.input.idols.map((i) => i.rating); // the ratings after 10 closes
    const share = (test: (r: number) => boolean) => last.filter(test).length / last.length;
    expect(share((r) => r >= 70 && r <= 85)).toBeGreaterThan(0.6);
    expect(share((r) => r >= 86 && r < 90)).toBeLessThan(0.05);
    expect(share((r) => r >= 90)).toBeLessThan(0.05);
    expect(share((r) => r < 65)).toBeLessThan(0.05);
  }, 300_000);
});
