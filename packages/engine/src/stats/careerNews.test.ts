import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { type Placed, careerNews, topPairs, trajectoryNews } from "./careerNews";
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

describe("trajectoryNews", () => {
  const p = (season: number, idolId: string, comp: string, finalRank: number): Placed => ({ season, idolId, comp, finalRank });
  const kinds = (rows: Placed[], cur: number, rating = 92) => trajectoryNews(rows, cur, () => rating).map((s) => `${s.kind}:${(s as { idol: string }).idol}`);
  it("runner-up streak, Unzure finalist streak, repeat champion, drought ended", () => {
    const rows = [p(1, "a", "D1A", 2), p(2, "a", "D1A", 2), p(1, "b", "UZC", 2), p(2, "b", "UZC", 2), p(2, "c", "D1B", 1), p(1, "c", "D1B", 1), p(1, "d", "D1C", 1), p(5, "d", "D1C", 1)];
    expect(kinds(rows, 2)).toEqual(expect.arrayContaining(["runner-up-streak:a", "runner-up-streak:b", "finalist-streak:b", "repeat-champion:c"]));
    expect(kinds(rows, 5)).toEqual(["drought-ended:d"]); // 4 seasons since its last title
  });
  it("a top idol without a title for 4 seasons; a promoted idol who wins at once; stuck in D2", () => {
    const dry = [1, 2, 3, 4].map((s) => p(s, "a", "IDL", 3));
    expect(kinds(dry, 4)).toEqual(["drought:a"]);
    expect(trajectoryNews(dry, 4, () => 80)).toEqual([]); // not a top tier idol
    expect(kinds([p(1, "e", "D2A", 2), p(2, "e", "D1A", 1)], 2)).toEqual(expect.arrayContaining(["promoted-champion:e"]));
    expect(kinds([p(1, "f", "D2B", 5), p(2, "f", "D2B", 4)], 2)).toEqual(["stuck-in-d2:f"]);
  });
  it("relegated again within 3 seasons; the big ones are breaking news", () => {
    const rows = [p(1, "g", "D1A", 4), p(1, "h", "D1A", 1), p(1, "i", "D1A", 2), p(1, "j", "D1A", 3), p(3, "g", "D1A", 4), p(3, "h", "D1A", 1), p(3, "i", "D1A", 2), p(3, "j", "D1A", 3)];
    expect(kinds(rows, 3)).toContain("relegated-again:g");
    expect(newsScore({ kind: "repeat-champion", idol: "a", comp: "D1A", seasons: 2 })).toBeGreaterThanOrEqual(BREAKING);
    expect(newsScore({ kind: "drought-ended", idol: "a", comp: "D1A", gap: 4 })).toBeGreaterThanOrEqual(BREAKING);
    expect(newsScore({ kind: "promoted-champion", idol: "a", league: "D1A" })).toBeGreaterThanOrEqual(BREAKING);
  });
});
