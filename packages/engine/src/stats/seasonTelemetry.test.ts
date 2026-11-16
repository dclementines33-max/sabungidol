import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { MIN_GAMES, seasonTelemetry } from "./seasonTelemetry";

const m = (a: string, b: string, scoreA: number, scoreB: number, ratingA: number, ratingB: number) =>
  ({ id: `${a}${b}${scoreA}${scoreB}`, comp: "D1A", stage: "LG", round: "MD01", slot: 1, idolA: a, idolB: b, games: [], scoreA, scoreB, result: scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "D", ratingA, ratingB, formA: "", formB: "" }) as SimMatch;
const times = <T,>(k: number, f: () => T) => Array.from({ length: k }, f);

describe("season telemetry", () => {
  it("equal ratings expect half the games: winning 3 of every 4 is +25 points, losing them −25", () => {
    const t = seasonTelemetry(times(5, () => m("a", "b", 3, 1, 80, 80)));
    expect(t.map((x) => [x.idolId, x.games, x.actual, x.expected, x.delta])).toEqual([["a", 20, 0.75, 0.5, 0.25], ["b", 20, 0.25, 0.5, -0.25]]);
  });

  it("a big favourite who only wins what her rating expects is on par, not an over-performer", () => {
    // 40 rating points at scale 40: a game is won 10/11 of the time.
    const t = seasonTelemetry(times(11, () => m("fav", "dog", 10, 1, 90, 50)));
    expect(t.find((x) => x.idolId === "fav")!.delta).toBeCloseTo(0);
    expect(t.find((x) => x.idolId === "fav")!.rating).toBe(90);
  });

  it("too few games: left out; order = best over-performer first", () => {
    expect(MIN_GAMES).toBe(10);
    expect(seasonTelemetry([m("a", "b", 3, 0, 80, 80)])).toEqual([]);
    const t = seasonTelemetry([...times(4, () => m("a", "x", 3, 0, 70, 80)), ...times(4, () => m("b", "x", 2, 1, 70, 80))]);
    expect(t.map((x) => x.idolId)).toEqual(["a", "b", "x"]);
  });
});
