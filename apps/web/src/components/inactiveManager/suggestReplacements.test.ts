import { describe, expect, it } from "vitest";
import { suggestReplacements } from "./suggestReplacements";

const idol = (id: string, rating: number, active = true) => ({ id, name: id, rating, active });
const idols = [idol("a", 90), idol("b", 80), idol("r1", 60), idol("r2", 70), idol("off", 99, false), idol("x", 50)];

describe("replacement suggestions", () => {
  it("only for idols with a league place, best reserve first, each reserve once", () => {
    expect(suggestReplacements(["a", "b", "x"], { D1A: ["a"], D2B: ["b", "x2"] }, idols)).toEqual([
      { id: "a", comp: "D1A", suggestion: "r2" },
      { id: "b", comp: "D2B", suggestion: "r1" },
    ]);
  });
  it("says so when no reserve is left", () => {
    expect(suggestReplacements(["a"], { D1A: ["a", "b", "r1", "r2", "x"] }, idols)).toEqual([{ id: "a", comp: "D1A", suggestion: null }]);
  });
});
