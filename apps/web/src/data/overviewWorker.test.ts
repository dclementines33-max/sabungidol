import { describe, expect, it } from "vitest";
import { countSeasonsDone } from "./overviewWorker";

describe("countSeasonsDone", () => {
  it("counts only archived seasons when live season is not 100% done", () => {
    expect(countSeasonsDone(2, 0.6, 5)).toBe(2);
  });

  it("adds live season to the count when progress is 100%", () => {
    expect(countSeasonsDone(2, 1, 5)).toBe(3);
  });

  it("does not count a live season with no active competitions (draft/empty)", () => {
    expect(countSeasonsDone(2, 1, 0)).toBe(2);
  });

  it("works with zero archived seasons", () => {
    expect(countSeasonsDone(0, 1, 9)).toBe(1);
    expect(countSeasonsDone(0, 0.5, 9)).toBe(0);
  });
});
