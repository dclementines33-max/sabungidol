import { describe, expect, it } from "vitest";
import { tierOf } from "./tier";

describe("tier (PRD §3)", () => {
  it("uses the PRD boundaries", () => {
    expect([100, 90, 89, 80, 79, 70, 69, 60, 59, 0].map(tierOf)).toEqual(["S", "S", "A", "A", "B", "B", "C", "C", "D", "D"]);
  });
});
