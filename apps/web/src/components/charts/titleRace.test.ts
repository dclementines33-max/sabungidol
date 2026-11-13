import { describe, expect, it } from "vitest";
import { pointsByMatchday } from "./titleRace";

describe("pointsByMatchday", () => {
  it("adds 3 for a win and 1 for a draw, and stops at the first unplayed matchday", () => {
    const fixtures = [
      { round: "MD01", matches: [{ idolA: "a", idolB: "b", scoreA: 3, scoreB: 1 }] },
      { round: "MD02", matches: [{ idolA: "b", idolB: "a", scoreA: 2, scoreB: 2 }] },
      { round: "MD03", matches: [{ idolA: "a", idolB: "b" }] },
    ];
    expect(pointsByMatchday(fixtures, ["a", "b"])).toEqual({ a: [0, 3, 4], b: [0, 0, 1] });
  });
});
