import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { AWARDS, MIN_MATCHES, seasonAwards } from "./seasonAwards";

let n = 0;
const m = (a: string, b: string, scoreA: number, scoreB: number, comp = "INK", stage = "KO", round = "R1") =>
  ({ id: `m${n++}`, comp, stage, round, slot: 1, idolA: a, idolB: b, games: [], scoreA, scoreB, result: scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "D", ratingA: 80, ratingB: 80, formA: "", formB: "" }) as SimMatch;
const times = (k: number, f: () => SimMatch) => Array.from({ length: k }, f);
const award = (list: ReturnType<typeof seasonAwards>, key: string) => list.find((a) => a.key === key);

describe("season awards", () => {
  // "ace" plays 24 (wins 20, 3–0 mostly); "solid" plays 30 (wins 18, never loses: draws the rest, concedes little);
  // "flash" wins all 5 of hers (too few matches for a rate award); "busy" plays the most, losing most.
  const season = [
    ...times(20, () => m("ace", "busy", 3, 0, "D1A", "LG", "MD01")), ...times(4, () => m("ace", "busy", 0, 3)),
    ...times(18, () => m("solid", "busy", 1, 0, "D1B", "LG", "MD01")), ...times(12, () => m("solid", "busy", 0, 0, "NUG")),
    ...times(5, () => m("flash", "busy", 3, 0)),
  ];
  const awards = seasonAwards(season, { D1A: { champion: "ace", runnerUp: "busy" }, INK: { champion: "solid", runnerUp: "x" }, NUG: { champion: "solid", runnerUp: "y" } }, new Map([["busy", 4], ["ace", -2]]));

  it("comes out in prestige order, MVI first", () => {
    expect(awards.map((a) => a.key)).toEqual(AWARDS.filter((k) => awards.some((a) => a.key === k)));
    expect(awards[0]!.key).toBe("mvi");
  });

  it("rate awards need the minimum matches: a perfect 5-match idol wins none of them", () => {
    expect(MIN_MATCHES).toBe(20);
    expect(award(awards, "mvi")).toMatchObject({ idol: "ace" }); // 83% wins + 1.5 games per match
    expect(award(awards, "daebak")).toEqual({ key: "daebak", idol: "solid", value: 0 });
    expect(award(awards, "unbreakable")).toMatchObject({ idol: "solid", value: 0 });
    expect(awards.some((a) => a.idol === "flash")).toBe(false);
  });

  it("counts: titles, wins, games won, matches, growth", () => {
    expect(award(awards, "golden-disk")).toEqual({ key: "golden-disk", idol: "solid", value: 2 });
    expect(award(awards, "encore")).toEqual({ key: "encore", idol: "ace", value: 20 });
    expect(award(awards, "hit-maker")).toMatchObject({ idol: "ace", value: 60 });
    expect(award(awards, "hallyu-wave")).toMatchObject({ idol: "busy", value: 59 });
    expect(award(awards, "glow-up")).toEqual({ key: "glow-up", idol: "busy", value: 4 });
    expect(seasonAwards(season, {}, new Map([["busy", -1]])).some((a) => a.key === "glow-up")).toBe(false); // nobody grew
  });

  it("Chart Topper: matchdays at #1 of The Idols and the Division 1 leagues", () => {
    const league = [m("a", "b", 3, 0, "D1A", "LG", "MD01"), m("c", "d", 3, 0, "D1A", "LG", "MD01"), m("b", "a", 3, 0, "D1A", "LG", "MD02"), m("b", "c", 3, 0, "D1A", "LG", "MD03"), m("b", "d", 3, 0, "D1A", "LG", "MD04"), // MD1 a, MD2 c (goal diff), MD3–4 b
      m("x", "y", 3, 0, "D2A", "LG", "MD01")]; // Division 2 doesn't count
    expect(award(seasonAwards(league, {}), "chart-topper")).toEqual({ key: "chart-topper", idol: "b", value: 2 });
  });

  it("Trend Setter: steady across at least 3 competitions; ties fall to the idol id", () => {
    const comps = ["INK", "NUG", "UZC"];
    const steady = comps.flatMap((c) => [...times(5, () => m("even", "z", 3, 0, c)), ...times(2, () => m("even", "z", 0, 3, c))]); // 5/7 everywhere
    const swing = comps.flatMap((c, i) => times(7, () => (i === 0 ? m("swing", "z", 0, 3, c) : m("swing", "z", 3, 0, c)))); // 0, 1, 1
    expect(award(seasonAwards([...steady, ...swing], {}), "trend-setter")).toMatchObject({ idol: "even", value: 71 });
    const twins = [...times(20, () => m("b", "z", 3, 0)), ...times(20, () => m("a", "z", 3, 0))];
    expect(award(seasonAwards(twins, {}), "encore")!.idol).toBe("a");
  });
});
