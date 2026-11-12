import { describe, expect, it } from "vitest";
import { type DrawIdol, drawGroups } from "./groupDraw";
import { matchRng } from "./rng";

// 64 idols from 6 leagues; 20 girl groups of 2–3 members, 14 soloists.
const idol = (k: number): DrawIdol => ({ id: `i${k}`, league: `D1${"ABCDEF"[k % 6]}`, groupId: k < 50 ? `g${k % 20}` : null });
const pots = [0, 1, 2, 3].map((p) => Array.from({ length: 16 }, (_, i) => idol(p * 16 + i)));

describe("Unzure Cup group draw (PRD §5.7, acceptance §5.10)", () => {
  it("10,000 seeds: always 16 groups of 4, one idol per pot, no two from the same girl group", () => {
    const potOf = new Map(pots.flatMap((pot, p) => pot.map((x) => [x.id, p])));
    let relaxed = 0;
    let broken = 0; // counted, then checked once: 10,000 × 64 expect() calls are too slow
    for (let s = 0; s < 10_000; s++) {
      const result = drawGroups(pots, matchRng("draw", `seed${s}`));
      if (result.groups.length !== 16 || new Set(result.groups.flat().map((x) => x.id)).size !== 64) broken++;
      for (const group of result.groups) {
        const girlGroups = group.map((x) => x.groupId).filter((g) => g !== null);
        if (group.length !== 4 || group.some((x, p) => potOf.get(x.id) !== p) || new Set(girlGroups).size !== girlGroups.length) broken++;
        if (!result.relaxed && new Set(group.map((x) => x.league)).size !== 4) broken++;
      }
      if (result.relaxed) relaxed++;
    }
    expect(broken).toBe(0);
    expect(relaxed).toBe(0); // with 6 leagues, "different league" is always reachable here
  }, 30_000);

  it("same seed gives the same draw", () => {
    expect(drawGroups(pots, matchRng("d", "x"))).toEqual(drawGroups(pots, matchRng("d", "x")));
  });

  it("drops the soft league rule (and says so) when it cannot hold", () => {
    const oneLeague = pots.map((pot) => pot.map((x) => ({ ...x, league: "D1A" })));
    const result = drawGroups(oneLeague, matchRng("d", "y"));
    expect(result.relaxed).toBe(true);
    expect(result.groups.every((g) => g.length === 4)).toBe(true);
  });

  it("fails with an explicit error instead of a short group", () => {
    const clash = pots.map((pot, p) => (p < 2 ? pot.map((x) => ({ ...x, groupId: "same" })) : pot));
    expect(() => drawGroups(clash, matchRng("d", "z"))).toThrow(/draw/i);
    expect(() => drawGroups(pots.slice(0, 3), matchRng("d", "z"))).toThrow();
  });
});
