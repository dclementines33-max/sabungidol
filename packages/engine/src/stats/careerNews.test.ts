import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { careerNews, topPairs } from "./careerNews";
import { BREAKING, newsScore } from "./newsScore";

const m = (a: string, b: string) => ({ idolA: a, idolB: b }) as SimMatch;

describe("careerNews", () => {
  it("top pairs this season, either side order", () => {
    expect(topPairs([m("b", "a"), m("a", "b"), m("c", "d")], 1)).toEqual([["a", "b", 2]]);
  });
  it("a rivalry is renewed only with enough earlier meetings; farewells, most titles first, at most 3", () => {
    const got = careerNews([["a", "b", 4, 3], ["c", "d", 5, 1]], [{ idol: "x", titles: 0 }, { idol: "y", titles: 4 }, { idol: "z", titles: 1 }, { idol: "w", titles: 0 }]);
    expect(got).toEqual([
      { kind: "rivalry-renewed", a: "a", b: "b", meetings: 4, earlier: 3 },
      { kind: "farewell", idol: "y", titles: 4 }, { kind: "farewell", idol: "z", titles: 1 }, { kind: "farewell", idol: "w", titles: 0 },
    ]);
  });
  it("breaking news: an early clinch or a big farewell yes, an idol of the month no", () => {
    expect(newsScore({ kind: "clinched", idol: "a", league: "D1A", matchday: 34, left: 4 })).toBeGreaterThanOrEqual(BREAKING);
    expect(newsScore({ kind: "farewell", idol: "a", titles: 6 })).toBeGreaterThanOrEqual(BREAKING);
    expect(newsScore({ kind: "idol-of-month", idol: "a", from: 1, to: 10, wins: 9 })).toBeLessThan(BREAKING);
  });
});
