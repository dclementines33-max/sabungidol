import { describe, expect, it } from "vitest";
import { bracketRounds, runBracket } from "./bracket";
import { lossCounts, playRandom } from "./bracketTestUtil";
import { knockoutTemplate, standardSeedOrder } from "./knockout";

describe("single elimination (PRD §4)", () => {
  it("standard seed order keeps 1 and 2 apart until the final", () => {
    expect(standardSeedOrder(16)).toEqual([1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]);
  });

  it("B-Side Cup: 16 idols, 15 matches, rounds R1 → QF → SF → F, final is stage FN", () => {
    const t = knockoutTemplate([16]);
    expect(t.length).toBe(15);
    expect(t.map((m) => m.round)).toEqual([...Array(8).fill("R1"), ...Array(4).fill("QF"), "SF", "SF", "F"]);
    expect(t.at(-1)!.stage).toBe("FN");
    const { ids, runs } = playRandom(t, 16);
    for (const run of runs) {
      const losses = lossCounts(run);
      expect(losses.size).toBe(15); // everyone but the champion loses exactly once
      expect([...losses.values()].every((n) => n === 1)).toBe(true);
      expect(ids).toContain(run.at(-1)!.winner);
    }
  });

  it("Unzure Cup KO: 32 idols with a 3rd-place match = 32 matches", () => {
    const t = knockoutTemplate([32], { thirdPlace: true });
    expect(t.length).toBe(32);
    const third = t.find((m) => m.round === "3RD")!;
    expect(third.stage).toBe("FN");
    const { runs } = playRandom(t, 32, 100);
    for (const run of runs) {
      const sf = run.filter((r) => r.round === "SF").map((r) => r.loser).sort();
      const thirdMatch = run.find((r) => r.round === "3RD")!;
      expect([thirdMatch.a, thirdMatch.b].sort()).toEqual(sf);
    }
  });

  it("Nugu Cup entry plan 120 / 44 / 76 = 9 rounds, 239 matches, ends with SF and F", () => {
    const t = knockoutTemplate([120, 44, 76]);
    expect(t.length).toBe(239);
    const perRound = (r: string) => t.filter((m) => m.round === r).length;
    expect(["R1", "R2", "R3", "R4", "R5", "R6", "QF", "SF", "F"].map(perRound)).toEqual([60, 52, 64, 32, 16, 8, 4, 2, 1]);
    const { runs } = playRandom(t, 240, 50);
    for (const run of runs) expect(lossCounts(run).size).toBe(239);
  });

  it("rejects a plan that makes an odd round", () => {
    expect(() => knockoutTemplate([120, 45, 75])).toThrow(/odd/);
    expect(() => knockoutTemplate([12])).toThrow(/odd/); // 12 → 6 → 3
  });
});

describe("pairing by rank (user decision for Nugu Cup)", () => {
  // Entrants per round are listed best first; a later entry round means a stronger idol.
  const t = knockoutTemplate([120, 44, 76], { pairing: "seed" });
  const strength = (seed: number) => (seed > 164 ? seed - 164 : seed > 120 ? seed - 120 + 76 : seed + 120); // 1 = best

  it("round 1 is best v worst; the best newcomer meets the weakest expected winner", () => {
    expect(t[0]).toMatchObject({ round: "R1", a: { seed: 1 }, b: { seed: 120 } });
    const r2 = t.filter((m) => m.round === "R2");
    expect(r2[0]).toMatchObject({ a: { seed: 121 }, b: { winner: "KO-R1-60" } });
    expect(t.filter((m) => m.round === "R3")[0]).toMatchObject({ a: { seed: 165 } });
  });

  it("if the stronger idol always wins, the two best idols meet only in the final", () => {
    const ids = Array.from({ length: 240 }, (_, i) => `seed${i + 1}`);
    const s = (id: string) => strength(Number(id.slice(4)));
    const run = runBracket(t, ids, (_, a, b) => (s(a) < s(b) ? "A" : "B"));
    expect(run.length).toBe(239);
    const final = run.at(-1)!;
    expect([final.a, final.b].sort()).toEqual(["seed165", "seed166"]);
  });
});

it("bracketRounds pauses once between rounds (B-Side: 4 rounds → 3 pauses)", () => {
  const ids = Array.from({ length: 16 }, (_, i) => `i${i}`);
  const rounds = bracketRounds(knockoutTemplate([16]), ids, () => "A");
  let pauses = 0;
  while (!rounds.next().done) pauses++;
  expect(pauses).toBe(3);
});
