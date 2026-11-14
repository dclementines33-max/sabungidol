// Locks the rating shape that Season Progression grows toward (user 2026-11-15): from the default seed roster, after
// 10 and 20 seasons most idols sit in the 70s to mid-80s, the top stays rare and the low band does not refill.
import { describe, expect, it } from "vitest";
import { gainFactor } from "./seasonClose";
import { syntheticSeasons } from "./synthetic";
import seedFile from "../../../../seed/idols.json";

const seed = (seedFile as { idols: { rating?: number | null }[] }).idols
  .map((i) => i.rating ?? 75).slice(0, 240);

describe("season progression shape", () => {
  it("gains get harder the higher the rating, in bands", () => {
    const f = [55, 65, 72, 80, 86, 90, 95, 100].map(gainFactor);
    expect(f.every((x, i) => i === 0 || x < f[i - 1]!)).toBe(true);
    expect(gainFactor(65)).toBeGreaterThan(1); // below 70: easy
    expect(gainFactor(80)).toBe(1);
    expect(gainFactor(88)).toBeLessThan(0.5); // 86–90: harder
    expect(gainFactor(92)).toBeLessThan(0.25); // 90+: hardest
  });

  it("after 10 and 20 seasons from the seed: the middle fills, 86+ stays small, 90+ rare, the low band shrinks", () => {
    const after: Record<number, number[]> = {};
    let n = 0;
    for (const s of syntheticSeasons(21, "shape", seed)) after[n++] = s.input.idols.map((i) => i.rating); // after[k] = after k closes
    const share = (k: number, test: (r: number) => boolean) => after[k]!.filter(test).length / 240;
    for (const k of [10, 20]) {
      expect(share(k, (r) => r >= 70 && r <= 85)).toBeGreaterThan(0.5);
      expect(share(k, (r) => r >= 86 && r < 90)).toBeLessThan(0.1);
      expect(share(k, (r) => r >= 90)).toBeLessThan(0.05);
      expect(share(k, (r) => r < 65)).toBeLessThan(share(0, (r) => r < 65)); // the low band does not refill
    }
    expect(share(20, (r) => r >= 75 && r <= 85)).toBeGreaterThan(share(0, (r) => r >= 75 && r <= 85) * 2);
  }, 300_000);
});
