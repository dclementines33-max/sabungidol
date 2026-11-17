import type { CareerRow } from "@sabung/engine";
import { describe, expect, it } from "vitest";
import { groupIndex, idolIndex } from "./sabungIndex";

const row = (idolId: string, over: Partial<CareerRow>) => ({ idolId, comp: "ALL", matches: 0, winRate: 0, runnerUp: 0, third: 0, finals: 0, giantKills: 0, invincibleSeasons: 0, reverseSweeps: 0, bestWinStreak: 0, ...over }) as CareerRow;
const idols = [{ id: "a", rating: 90, groupId: "g1" }, { id: "b", rating: 95, groupId: "g1" }, { id: "c", rating: 70, groupId: "g2" }, { id: "d", rating: 60, groupId: null }];

describe("Sabung Index", () => {
  it("titles count by prestige, awards by their weight, MAMA left to groups", () => {
    const ranked = idolIndex(idols, [row("a", { matches: 60, winRate: 0.5 })], [{ idolId: "a", comp: "UZC", titles: 1 }, { idolId: "c", comp: "D2", titles: 2 }],
      [{ key: "mvi", id: "c" }, { key: "mama", id: "g2" }]);
    const by = Object.fromEntries(ranked.map((r) => [r.id, r]));
    expect(by.a!.parts).toMatchObject({ titles: 12, form: 20, rating: 24 }); // Unzure = prestige 1
    expect(by.c!.parts).toMatchObject({ titles: 6, awards: 16, rating: 12 }); // D2 = 0.25 × 2 titles; MVI weighs 2
    expect(ranked[0]!.id).toBe("a");
    expect(by.a!.score).toBe(56);
  });

  it("the win rate counts in part until 60 matches; ties go to the higher rating", () => {
    const [x] = idolIndex([{ id: "x", rating: 50, groupId: null }], [row("x", { matches: 30, winRate: 1 })], [], []);
    expect(x!.parts.form).toBe(20);
    expect(idolIndex([{ id: "p", rating: 80, groupId: null }, { id: "q", rating: 81, groupId: null }], [], [], []).map((r) => r.id)).toEqual(["q", "p"]);
  });

  it("a group = its best four members + 20 per MAMA; soloists have no group", () => {
    const ranked = idolIndex(idols, [], [], []);
    const groups = groupIndex(idols, ranked, [{ key: "mama", id: "g2" }, { key: "mama", id: "g2" }]);
    expect(groups.map((g) => g.id)).toEqual(["g2", "g1"]); // 12 + 40 MAMA beats 27 + 24
    expect(groups.find((g) => g.id === "g1")).toMatchObject({ score: 51, members: ["b", "a"] });
  });
});
