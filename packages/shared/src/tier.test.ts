import { describe, expect, it } from "vitest";
import { tierOf } from "./tier";

describe("tier (user bands 2026-11-15)", () => {
  it("puts each boundary in the right band", () => {
    expect([100, 96, 95, 90, 89, 83, 82, 75, 74, 65, 64, 55, 54, 0].map(tierOf))
      .toEqual(["S+", "S+", "S", "S", "A", "A", "B", "B", "C", "C", "D", "D", "F", "F"]);
  });

  it("uses lower bounds for decimals and keeps out-of-range values in a band", () => {
    expect([95.9, 96, 89.99, 54.5, -3].map(tierOf)).toEqual(["S", "S+", "A", "F", "F"]);
  });
});
