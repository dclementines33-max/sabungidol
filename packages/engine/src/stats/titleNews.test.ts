import { describe, expect, it } from "vitest";
import { computeStandings } from "../standings";
import type { SimMatch, Title } from "../season/types";
import { BREAKING, newsScore } from "./newsScore";
import { titleNews } from "./titleNews";

const m = (id: string, over: Partial<SimMatch>) =>
  ({ id, comp: "D1A", stage: "LG", round: "MD01", slot: 1, idolA: "a", idolB: "b", games: [], scoreA: 2, scoreB: 0, result: "A", ratingA: 80, ratingB: 80, formA: "", formB: "", ...over }) as SimMatch;

// Double round robin; result(x, y) decides each match. Titles from the table, as the season does.
function league(ratings: Record<string, number>, result: (x: string, y: string) => "A" | "B" | "D") {
  const ids = Object.keys(ratings);
  const matches = ids.flatMap((x, i) => ids.slice(i + 1).flatMap((y) => [0, 1].map((leg) => {
    const [a, b] = leg ? [y, x] : [x, y];
    return m(`${a}-${b}`, { idolA: a, idolB: b, ratingA: ratings[a]!, ratingB: ratings[b]!, result: result(a, b) });
  })));
  const [first, second] = computeStandings(ids.map((id) => ({ id, startRating: ratings[id]! })), matches);
  return { matches, titles: { D1A: { champion: first!.idolId, runnerUp: second!.idolId } } as Record<string, Title> };
}
const winsAll = (who: string) => (a: string, b: string) => (a === who ? "A" : b === who ? "B" : "D");

describe("titleNews", () => {
  it("90 vs 78: a champion far below the favourite, past many better-rated idols, is breaking news", () => {
    const ratings = { fav: 90, b: 88, c: 86, d: 84, e: 82, f: 80, champ: 78, h: 70 };
    const { matches, titles } = league(ratings, winsAll("champ"));
    const story = titleNews(matches, titles).find((s) => s.kind === "underdog-champion")!;
    expect(story).toEqual({ kind: "underdog-champion", idol: "champ", title: "D1A", rating: 78, favourite: "fav", favouriteRating: 90, above: 6 });
    expect(newsScore(story)).toBeGreaterThanOrEqual(BREAKING);
    // Smaller gap, fewer idols above: still a story, but a smaller one.
    const small = league({ fav: 84, b: 83, c: 82, champ: 79 }, winsAll("champ"));
    const minor = titleNews(small.matches, small.titles).find((s) => s.kind === "underdog-champion")!;
    expect(newsScore(minor)).toBeLessThan(newsScore(story));
  });

  it("a clear favourite who doesn't win is a flop, with the league rank", () => {
    const { matches, titles } = league({ fav: 86, a: 84, b: 83, c: 82 }, (x, y) => (x === "a" ? "A" : y === "a" ? "B" : x === "fav" ? "B" : y === "fav" ? "A" : "D"));
    expect(titleNews(matches, titles)).toContainEqual(expect.objectContaining({ kind: "favourite-flop", idol: "fav", champion: "a", rank: 4 }));
    // Two idols share the top rating: no favourite to flop.
    const shared = league({ x: 86, y: 86, a: 84, b: 83 }, winsAll("a"));
    expect(titleNews(shared.matches, shared.titles).some((s) => s.kind === "favourite-flop")).toBe(false);
  });

  it("title race: level on points, narrow and runaway margins", () => {
    const race = (result: (x: string, y: string) => "A" | "B" | "D") => {
      const { matches, titles } = league({ a: 85, b: 85, c: 80, d: 80 }, result);
      return titleNews(matches, titles).find((s) => s.kind === "title-race");
    };
    // a and b beat everyone else and draw each other: level on points.
    const top = (x: string, y: string) => (["a", "b"].includes(x) && ["a", "b"].includes(y) ? "D" : ["a", "b"].includes(x) ? "A" : ["a", "b"].includes(y) ? "B" : "D");
    expect(race(top)).toMatchObject({ how: "level", margin: 0 });
    expect(newsScore(race(top)!)).toBeGreaterThanOrEqual(BREAKING);
    // b drops 2 points with a draw against c: 2 points behind.
    expect(race((x, y) => (x === "b" && y === "c" ? "D" : top(x, y)))).toMatchObject({ how: "narrow", margin: 2 });
    // a wins everything; the rest draw: 18 vs 4 points.
    expect(race(winsAll("a"))).toMatchObject({ how: "runaway", margin: 14 });
    const { matches, titles } = league({ a: 85, b: 85, c: 80, d: 80 }, winsAll("a"));
    expect(titleNews(matches, titles)[0]).toEqual({ kind: "title-summary", idol: "a", runnerUp: titles.D1A!.runnerUp, title: "D1A", points: 18, margin: 14, score: null });
  });

  it("knockout: the favourite out early, a final in the deciding game", () => {
    const ko = (id: string, round: string, a: string, b: string, ra: number, rb: number, scoreA = 3, scoreB = 1) =>
      m(id, { comp: "INK", stage: "KO", round, idolA: a, idolB: b, ratingA: ra, ratingB: rb, scoreA, scoreB, result: scoreA > scoreB ? "A" : "B" });
    const matches = [ko("q1", "QF", "low", "fav", 80, 92), ko("q2", "QF", "b", "c", 85, 84), ko("s1", "SF", "low", "b", 80, 85), ko("f", "F", "low", "b", 80, 85, 3, 2)];
    const news = titleNews(matches, { INK: { champion: "low", runnerUp: "b" } });
    expect(news).toContainEqual({ kind: "final-thriller", idol: "low", runnerUp: "b", title: "INK", score: "3–2" });
    expect(news).toContainEqual(expect.objectContaining({ kind: "underdog-champion", idol: "low", favourite: "fav", above: 3 }));
    // Without the big gap: the favourite's early exit is the story, with its round.
    const close = matches.map((x) => (x.id === "q1" ? { ...x, ratingB: 84 } : x)).map((x) => ({ ...x, ratingA: x.idolA === "low" ? 83 : x.ratingA }));
    expect(titleNews(close, { INK: { champion: "low", runnerUp: "b" } })).toContainEqual(expect.objectContaining({ kind: "favourite-flop", idol: "b", stage: "KO", round: "F" }));
  });

  it("groups + knockout (Unzure Cup): a favourite out in the groups; a one-off final has no favourite", () => {
    const g = (id: string, a: string, b: string, ra: number, rb: number, result: "A" | "B") => m(id, { comp: "UZC", stage: "GS", round: "A-MD1", idolA: a, idolB: b, ratingA: ra, ratingB: rb, result });
    const matches = [g("g1", "fav", "a", 95, 90, "B"), g("g2", "b", "c", 89, 88, "A"), g("g3", "fav", "b", 95, 89, "B"), g("g4", "a", "c", 90, 88, "A"),
      m("f", { comp: "UZC", stage: "KO", round: "F", idolA: "a", idolB: "b", ratingA: 90, ratingB: 89, scoreA: 3, scoreB: 0, result: "A" })];
    expect(titleNews(matches, { UZC: { champion: "a", runnerUp: "b" } })).toEqual([
      { kind: "title-summary", idol: "a", runnerUp: "b", title: "UZC", points: null, margin: null, score: "3–0" },
      expect.objectContaining({ kind: "favourite-flop", idol: "fav", stage: "GS", rank: null }),
    ]);
    const dsg = [m("d", { comp: "DSG", stage: "FN", round: "F", idolA: "x", idolB: "y", ratingA: 70, ratingB: 95, scoreA: 3, scoreB: 2 })];
    expect(titleNews(dsg, { DSG: { champion: "x", runnerUp: "y" } }).map((s) => s.kind)).toEqual(["title-summary"]); // facts only
  });
});
