// Update 3: Nugu and B-Side are the upset cups (fatigue from the big cups, rating gaps count less, a larger swing).
// Measured over 10 seasons before the change: a 10+ point favourite lost 20.0% of these series; after: 26.8%.
import { describe, expect, it } from "vitest";
import { runSeason } from "./runSeason";
import { testSeason } from "./testRoster";

describe("upset cups", () => {
  it("a favourite by 10+ rating points loses clearly more often than before in Nugu and B-Side, but still mostly wins", () => {
    const wide = ["s0", "s1", "s2", "s3", "s4", "s5"].flatMap((seed) => runSeason(testSeason(seed)).matches)
      .filter((m) => (m.comp === "NUG" || m.comp.startsWith("BS")) && Math.abs(m.ratingA - m.ratingB) >= 10);
    const upsets = wide.filter((m) => (m.result === "A") === m.ratingA < m.ratingB).length / wide.length;
    expect(upsets).toBeGreaterThan(0.235);
    expect(upsets).toBeLessThan(0.35);
  }, 120_000);
});
