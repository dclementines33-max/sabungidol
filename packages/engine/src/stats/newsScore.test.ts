import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { newsScore, topNews } from "./newsScore";
import { seasonNews } from "./seasonNews";

const m = (id: string, a: string, b: string, result: "A" | "B" | "D", ratingA = 70, ratingB = 70, round = "MD01", comp: SimMatch["comp"] = "D1A"): SimMatch =>
  ({ id, comp, stage: "LG", round, slot: 1, idolA: a, idolB: b, games: [], scoreA: 0, scoreB: 0, result, ratingA, ratingB, formA: "Steady", formB: "Steady" });

describe("news score", () => {
  it("ranks records and big titles above everyday news", () => {
    expect(newsScore({ kind: "points-record", idol: "a", league: "D1A", points: 90, previous: 88 })).toBeGreaterThan(newsScore({ kind: "upset", matchId: "x", winner: "a", loser: "b", gap: 20 }));
    expect(newsScore({ kind: "first-title", idol: "a", title: "UZC", runnerUp: "b" })).toBe(90);
    expect(newsScore({ kind: "first-title", idol: "a", title: "MBK-D1A", runnerUp: "b" })).toBeLessThan(60);
    expect(newsScore({ kind: "upset", matchId: "x", winner: "a", loser: "b", gap: 40 })).toBe(90); // capped
  });

  it("top news: highest first, one per kind, n items", () => {
    const top = topNews([
      { kind: "upset", matchId: "1", winner: "a", loser: "b", gap: 10 },
      { kind: "upset", matchId: "2", winner: "c", loser: "d", gap: 25 },
      { kind: "idol-of-month", idol: "a", from: 1, to: 10, wins: 8 },
      { kind: "points-record", idol: "a", league: "D1A", points: 90, previous: 88 },
    ], 2);
    expect(top.map((s) => s.kind)).toEqual(["points-record", "upset"]);
    expect(top[1]).toMatchObject({ matchId: "2" });
  });
});

describe("season news", () => {
  it("finds the rivalry, double titles and a title milestone; 3 losses in a row is no slump yet", () => {
    const matches = [m("1", "a", "b", "A", 88, 70), m("2", "b", "a", "A", 70, 88), m("3", "a", "b", "B", 88, 70), m("4", "c", "a", "A", 70, 88), m("5", "a", "c", "D", 88, 70)];
    const news = seasonNews(matches, { D1A: { champion: "a", runnerUp: "b" }, UZC: { champion: "a", runnerUp: "c" }, INK: { champion: "b", runnerUp: "c" } }, new Map([["a", 4]]));
    expect(news).toEqual([
      { kind: "rivalry", a: "a", b: "b", meetings: 3, winsA: 1, winsB: 2 },
      { kind: "multi-title", idol: "a", titles: ["D1A", "UZC"] },
      { kind: "title-milestone", idol: "a", total: 5 },
    ]);
  });

  it("a strong idol losing 4 in a row is a slump", () => {
    const news = seasonNews(["1", "2", "3", "4"].map((id) => m(id, "a", `x${id}`, "B", 90)), {}, new Map());
    expect(news).toEqual([{ kind: "slump", matchId: "4", idol: "a", losses: 4, rating: 90 }]);
  });

  it("an idol with no loss in a finished league is unbeaten", () => {
    const news = seasonNews([m("1", "a", "b", "A"), m("2", "a", "c", "D"), m("3", "b", "c", "A", 70, 70, "MD38")], {}, new Map());
    expect(news).toEqual([{ kind: "unbeaten", idol: "a", league: "D1A", wins: 1, draws: 1 }]);
  });
});
