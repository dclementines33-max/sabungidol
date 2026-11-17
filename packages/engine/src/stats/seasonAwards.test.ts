import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { AWARDS, MAX_AWARD_BONUS, MIN_MATCHES, NOMINEES, awardBonus, seasonAwards } from "./seasonAwards";

let n = 0;
const m = (a: string, b: string, scoreA: number, scoreB: number, comp = "INK", stage = "KO", round = "R1") =>
  ({ id: `m${n++}`, comp, stage, round, slot: 1, idolA: a, idolB: b, games: [], scoreA, scoreB, result: scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "D", ratingA: 80, ratingB: 80, formA: "", formB: "" }) as SimMatch;
const times = (k: number, f: () => SimMatch) => Array.from({ length: k }, f);
const award = (list: ReturnType<typeof seasonAwards>, key: string) => list.find((a) => a.key === key);

describe("season awards", () => {
  // Tiers (PRESTIGE): D1 0.8, Inkigayo 0.7, Nugu 0.6, Unzure 1.
  // "ace" plays 24 (20 D1 wins 3–0, 4 Inkigayo losses 0–3); "solid" plays 30 (18 D1 wins 1–0, 12 Nugu draws);
  // "flash" wins all 5 of hers (too few matches for a rate award); "busy" plays the most, losing most.
  const season = [
    ...times(20, () => m("ace", "busy", 3, 0, "D1A", "LG", "MD01")), ...times(4, () => m("ace", "busy", 0, 3)),
    ...times(18, () => m("solid", "busy", 1, 0, "D1B", "LG", "MD01")), ...times(12, () => m("solid", "busy", 0, 0, "NUG")),
    ...times(5, () => m("flash", "busy", 3, 0)),
  ];
  const scores = new Map([["ace", 90], ["solid", 80], ["busy", 70], ["flash", 10]]);
  const groups = new Map<string, string | null>([["ace", "g1"], ["flash", "g1"], ["solid", "g2"], ["busy", "g2"]]);
  const awards = seasonAwards(season, { D1A: { champion: "ace", runnerUp: "busy" }, INK: { champion: "solid", runnerUp: "x" }, NUG: { champion: "solid", runnerUp: "y" } },
    { growth: new Map([["busy", 4], ["ace", -2]]), scores, groups });

  it("comes out in prestige order, MVI and Idol of the Season first; Hit Maker is gone", () => {
    expect(awards.map((a) => a.key)).toEqual(AWARDS.filter((k) => awards.some((a) => a.key === k)));
    expect(awards.slice(0, 2).map((a) => a.key)).toEqual(["mvi", "iots"]);
    expect(AWARDS).not.toContain("hit-maker");
  });

  it("every award keeps its nominees (winner first, at most 10)", () => {
    for (const a of awards) {
      expect(a.top[0]).toEqual({ id: a.id, value: a.value });
      expect(a.top.length).toBeLessThanOrEqual(NOMINEES);
    }
    expect(award(awards, "encore")!.top.map((x) => x.id)).toEqual(["ace", "solid", "flash", "busy"]) // 16, 14.4, 3.5, 2.8;
  });

  it("rate awards need the minimum matches and weigh every match by its tier", () => {
    expect(MIN_MATCHES).toBe(20);
    expect(award(awards, "mvi")).toMatchObject({ id: "ace", value: 83.2 }); // (100 × 16 + 10 × 39.6) / 24
    expect(award(awards, "daebak")).toMatchObject({ id: "solid", value: 0 });
    expect(award(awards, "unbreakable")).toMatchObject({ id: "solid", value: 0 });
    expect(awards.some((a) => a.key !== "encore" && a.key !== "hallyu-wave" && a.top.some((x) => x.id === "flash") && ["mvi", "daebak", "unbreakable", "trend-setter"].includes(a.key))).toBe(false);
  });

  it("tier-weighted counts: title points, wins, matches; growth as is", () => {
    expect(award(awards, "golden-disk")).toMatchObject({ id: "solid", value: 1.3 }); // Inkigayo 0.7 + Nugu 0.6 beats one D1 title 0.8
    expect(award(awards, "encore")).toMatchObject({ id: "ace", value: 16 });
    expect(award(awards, "hallyu-wave")).toMatchObject({ id: "busy", value: 43.9 });
    expect(award(awards, "glow-up")).toMatchObject({ id: "busy", value: 4 });
    expect(seasonAwards(season, {}, { growth: new Map([["busy", -1]]) }).some((a) => a.key === "glow-up")).toBe(false); // nobody grew
  });

  it("Idol of the Season = season score; MAMA = a group's best three members' season scores", () => {
    expect(award(awards, "iots")).toMatchObject({ id: "ace", value: 90 });
    expect(award(awards, "mama")!.top).toEqual([{ id: "g2", value: 150 }, { id: "g1", value: 100 }]);
    expect(seasonAwards(season, {}).some((a) => a.key === "iots" || a.key === "mama")).toBe(false); // needs scores (and groups)
  });

  it("Chart Topper: tier-weighted matchdays at #1 of The Idols and the Division 1 leagues", () => {
    const league = [m("a", "b", 3, 0, "D1A", "LG", "MD01"), m("c", "d", 3, 0, "D1A", "LG", "MD01"), m("b", "a", 3, 0, "D1A", "LG", "MD02"), m("b", "c", 3, 0, "D1A", "LG", "MD03"), m("b", "d", 3, 0, "D1A", "LG", "MD04"), // MD1 a, MD2 c (goal diff), MD3–4 b
      m("x", "y", 3, 0, "D2A", "LG", "MD01")]; // Division 2 doesn't count
    expect(award(seasonAwards(league, {}), "chart-topper")).toMatchObject({ id: "b", value: 1.6 });
  });

  it("Trend Setter: the competitions she won more than she lost, each × its tier; ties fall to the id", () => {
    const comps = ["INK", "NUG", "UZC"];
    const even = comps.flatMap((c) => [...times(5, () => m("even", "z", 3, 0, c)), ...times(2, () => m("even", "z", 0, 3, c))]); // winning in all 3
    const swing = comps.flatMap((c, i) => times(7, () => (i === 0 ? m("swing", "z", 0, 3, c) : m("swing", "z", 3, 0, c)))); // NUG + UZC only
    expect(award(seasonAwards([...even, ...swing], {}), "trend-setter")!.top.slice(0, 2)).toEqual([{ id: "even", value: 2.3 }, { id: "swing", value: 1.6 }]);
    const twins = [...times(20, () => m("b", "z", 3, 0)), ...times(20, () => m("a", "z", 3, 0))];
    expect(award(seasonAwards(twins, {}), "encore")!.id).toBe("a");
  });

  it("award bonus: winners only, MAMA for the counted members, capped", () => {
    const bonus = awardBonus(awards, scores, groups);
    expect(bonus.get("ace")).toBe(MAX_AWARD_BONUS); // MVI 2 + IOTS 2 + … capped at 3
    expect(bonus.get("busy")).toBe(3); // MAMA (g2) 1 + Glow Up 1 + Hallyu Wave 1
    expect(bonus.has("flash")).toBe(false);
  });
});
