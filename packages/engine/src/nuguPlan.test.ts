import { describe, expect, it } from "vitest";
import { knockoutTemplate } from "./knockout";
import { nuguEntryPlan } from "./nuguPlan";

describe("Nugu Cup entry solver (PRD §5.9)", () => {
  it("default roster gives the PRD plan: 120 D2 in R1, 44 D1 in R2, 76 D1 in R3", () => {
    expect(nuguEntryPlan(120, 120, 9)).toEqual([120, 44, 76]);
  });

  it("recomputes for a changed roster and still builds a valid bracket", () => {
    for (const [d2, d1] of [[118, 120], [120, 116], [100, 120]]) {
      const plan = nuguEntryPlan(d2, d1, 9);
      expect(plan[0]).toBe(d2);
      expect(plan[1] + plan[2]).toBe(d1);
      expect(knockoutTemplate(plan).length).toBe(d2 + d1 - 1);
    }
  });

  it("refuses a roster that cannot fit", () => {
    expect(() => nuguEntryPlan(119, 120, 9)).toThrow();
    expect(() => nuguEntryPlan(120, 300, 9)).toThrow();
  });
});
