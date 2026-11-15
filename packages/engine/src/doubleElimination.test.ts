import { describe, expect, it } from "vitest";
import { lossCounts, playRandom } from "./bracketTestUtil";
import { idolsPlayoffTemplate, inkigayoTemplate } from "./doubleElimination";

function checkDoubleElimination(template: ReturnType<typeof inkigayoTemplate>, entrants: number, goHomeOnFirstLoss: string[]) {
  const { ids, runs } = playRandom(template, entrants);
  for (const run of runs) {
    const champion = run.at(-1)!.winner;
    const losses = lossCounts(run);
    expect(losses.has(champion) ? losses.get(champion) : 0).toBeLessThanOrEqual(1); // no bracket reset
    for (const id of ids) {
      if (id === champion) continue;
      const last = run.filter((r) => r.a === id || r.b === id).at(-1)!;
      expect(last.loser).toBe(id); // everyone else ends on a loss
      expect(losses.get(id)).toBeLessThanOrEqual(2);
    }
    for (const key of goHomeOnFirstLoss) {
      const loser = run.find((r) => r.key === key)!.loser;
      expect(losses.get(loser)).toBe(1);
    }
  }
}

describe("double elimination (PRD §4)", () => {
  it("The Idols playoff: top 10, 16 matches, GF is Bo7 stage FN", () => {
    const t = idolsPlayoffTemplate();
    expect(t.length).toBe(16);
    expect(t.filter((m) => m.stage === "UB").length).toBe(7);
    expect(t.filter((m) => m.stage === "LB").length).toBe(8);
    expect(t.at(-1)).toMatchObject({ stage: "FN", round: "GF" });
    checkDoubleElimination(t, 10, []);
    const first = t.filter((m) => m.round === "LB1");
    expect(first.some((m) => "seed" in m.a && "seed" in m.b)).toBe(false); // seeds 9 and 10 are in different matches
  });

  it("Inkigayo Cup: 6 league champions, seeds 1–2 bye, UB R1 losers go home, 8 matches", () => {
    const t = inkigayoTemplate();
    expect(t.length).toBe(8);
    const firstMatches = new Set(t.flatMap((m) => [m.a, m.b]).filter((s) => "seed" in s).map((s) => (s as { seed: number }).seed));
    expect(firstMatches).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    expect(t.filter((m) => m.round === "R1").flatMap((m) => [m.a, m.b])).not.toContainEqual({ seed: 1 });
    checkDoubleElimination(t, 6, ["UB-R1-1", "UB-R1-2"]);
  });
});
