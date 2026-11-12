import { describe, expect, it } from "vitest";
import { seedKnockout } from "./knockoutSeeding";
import { matchRng } from "./rng";

const leagues = "ABCDEF";
const groups = Array.from({ length: 16 }, (_, g) => ({
  winner: { id: `w${g}`, league: `D1${leagues[g % 6]}` },
  runnerUp: { id: `r${g}`, league: `D1${leagues[(g + 1) % 6]}` },
}));

describe("Unzure Cup R32 seeding (PRD §5.8)", () => {
  it("10,000 seeds: 16 matches of winner v runner-up, 8 winners per half, never a group rematch", () => {
    let relaxed = 0;
    for (let s = 0; s < 10_000; s++) {
      const result = seedKnockout(groups, matchRng("ko", `seed${s}`));
      expect(result.pairs.length).toBe(16);
      expect(new Set(result.pairs.map((p) => p[0])).size).toBe(16);
      expect(new Set(result.pairs.map((p) => p[1])).size).toBe(16);
      for (const [w, r] of result.pairs) {
        expect(w.startsWith("w") && r.startsWith("r")).toBe(true);
        expect(w.slice(1)).not.toBe(r.slice(1));
      }
      expect(result.pairs.slice(0, 8).every(([w]) => w.startsWith("w"))).toBe(true);
      if (result.relaxed) relaxed++;
    }
    expect(relaxed).toBe(0);
  }, 30_000); // 2.4 s here; room for a slower machine

  it("avoids league mates in R32 when possible", () => {
    const leagueOf = new Map(groups.flatMap((g) => [[g.winner.id, g.winner.league], [g.runnerUp.id, g.runnerUp.league]]));
    const { pairs } = seedKnockout(groups, matchRng("ko", "x"));
    expect(pairs.every(([w, r]) => leagueOf.get(w) !== leagueOf.get(r))).toBe(true);
  });

  it("same seed gives the same bracket; wrong group count throws", () => {
    expect(seedKnockout(groups, matchRng("ko", "y"))).toEqual(seedKnockout(groups, matchRng("ko", "y")));
    expect(() => seedKnockout(groups.slice(1), matchRng("ko", "y"))).toThrow();
  });
});
