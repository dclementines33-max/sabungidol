import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { computeStandings, type StandingMatch } from "./standings";

const m = (idolA: string, idolB: string, scoreA: number, scoreB: number): StandingMatch => ({
  idolA, idolB, scoreA, scoreB, result: scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "D",
});
const idols = (ratings: Record<string, number>) => Object.entries(ratings).map(([id, startRating]) => ({ id, startRating }));
const order = (rows: { idolId: string }[]) => rows.map((r) => r.idolId);

describe("standings (PRD §5.5)", () => {
  it("counts 3/1/0, games and ranks", () => {
    const rows = computeStandings(idols({ a: 70, b: 70, c: 70 }), [m("a", "b", 3, 1), m("b", "c", 2, 2)]);
    expect(rows[0]).toEqual({ idolId: "a", rank: 1, played: 1, wins: 1, draws: 0, losses: 0, points: 3, gamesWon: 3, gamesLost: 1, gameDiff: 2 });
    expect(order(rows)).toEqual(["a", "c", "b"]); // c and b both 1 pt; c has game diff 0, b −2
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("includes idols with no matches", () => {
    expect(computeStandings(idols({ a: 70 }), [])[0]).toMatchObject({ idolId: "a", played: 0, points: 0 });
  });

  it("game difference, then games won, before rating", () => {
    const rows = computeStandings(idols({ p: 50, q: 90, r: 90, s: 99 }), [m("p", "q", 3, 1), m("r", "s", 2, 0)]);
    expect(order(rows)).toEqual(["p", "r", "q", "s"]);
  });

  it("head-to-head points before rating", () => {
    const rows = computeStandings(idols({ a: 60, b: 90, c: 70, d: 70 }), [m("a", "b", 3, 1), m("c", "a", 3, 1), m("b", "d", 3, 1)]);
    expect(order(rows)).toEqual(["c", "a", "b", "d"]);
  });

  it("number of wins before rating", () => {
    const fillers = { o1: 50, o2: 50, o3: 50, o4: 50, o5: 50, o6: 50 };
    const rows = computeStandings(idols({ e: 60, f: 90, ...fillers }), [
      m("e", "o1", 3, 0), m("e", "o2", 1, 3), m("e", "o3", 2, 3),
      m("f", "o4", 2, 2), m("f", "o5", 2, 2), m("f", "o6", 2, 2),
    ]);
    const ef = order(rows).filter((id) => id === "e" || id === "f");
    expect(ef).toEqual(["e", "f"]);
  });

  it("then rating at season start, then idol id", () => {
    const cycle = [m("a", "b", 3, 1), m("b", "c", 3, 1), m("c", "a", 3, 1)];
    expect(order(computeStandings(idols({ a: 70, b: 80, c: 75 }), cycle))).toEqual(["b", "c", "a"]);
    expect(order(computeStandings(idols({ z: 70, y: 70 }), []))).toEqual(["y", "z"]);
  });

  it("never trusts input order: any shuffle gives the same table", () => {
    const list = idols({ a: 70, b: 70, c: 71, d: 69, e: 70 });
    const matches = [m("a", "b", 2, 2), m("c", "d", 3, 1), m("e", "a", 1, 3), m("b", "c", 3, 0), m("d", "e", 2, 2)];
    const expected = computeStandings(list, matches);
    fc.assert(fc.property(fc.shuffledSubarray(list, { minLength: 5 }), fc.shuffledSubarray(matches, { minLength: 5 }),
      (l, ms) => { expect(computeStandings(l, ms)).toEqual(expected); }));
  });

  it("rejects a match with an idol that is not in the table", () => {
    expect(() => computeStandings(idols({ a: 70 }), [m("a", "x", 3, 0)])).toThrow();
  });
});
