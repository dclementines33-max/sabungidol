import { describe, expect, it } from "vitest";
import { realisticVariety, resetAll, seedPresets } from "./ratingPresets";

const idols = Array.from({ length: 200 }, (_, n) => ({ id: `i${n}`, rating: 50 + (n % 50), seed: (n % 5) || null }));

describe("Rating Manager presets (PRD §6.6)", () => {
  it("seed presets: 1 = 88 … 4 = 64, jitter within ±3, no seed = untouched", () => {
    const plain = seedPresets(idols, false);
    expect([plain.get("i1"), plain.get("i2"), plain.get("i3"), plain.get("i4")]).toEqual([88, 80, 72, 64]);
    expect(plain.has("i0")).toBe(false);
    for (const [id, r] of seedPresets(idols, true)) expect(Math.abs(r - plain.get(id)!)).toBeLessThanOrEqual(3);
  });

  it("realistic variety keeps the order and looks like μ 72, σ 9", () => {
    const out = realisticVariety(idols, "test");
    const byOld = [...idols].sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id)).map((i) => out.get(i.id)!);
    expect(byOld).toEqual([...byOld].sort((a, b) => b - a));
    const mean = byOld.reduce((s, x) => s + x, 0) / byOld.length;
    expect(mean).toBeGreaterThan(70);
    expect(mean).toBeLessThan(74);
  });

  it("reset all to 75", () => expect([...resetAll(idols).values()].every((r) => r === 75)).toBe(true));
});
