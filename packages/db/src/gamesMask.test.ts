import { describe, expect, it } from "vitest";
import { gamesFromMask, gamesToMask } from "./gamesMask";

describe("games bitmask", () => {
  it("round-trips every game order", () => {
    for (const games of [["A", "A"], ["B", "A", "B", "A"], ["A", "B", "A", "B", "A", "B", "B"]] as ("A" | "B")[][]) {
      expect(gamesFromMask(gamesToMask(games), games.length)).toEqual(games);
    }
  });
  it("fits a smallint", () => {
    expect(gamesToMask(Array(7).fill("A"))).toBe(127);
  });
});
