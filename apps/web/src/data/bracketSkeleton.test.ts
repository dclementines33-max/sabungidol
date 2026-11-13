import { describe, expect, it } from "vitest";
import { bracketSkeleton } from "./bracketSkeleton";

describe("bracketSkeleton", () => {
  it("draws every slot of a cup from the start, blank where nobody is known", () => {
    expect(bracketSkeleton("UZC", [], 120, 120).blank).toHaveLength(32); // R32 16 + 8 + 4 + 2 + final + 3rd place
    expect(bracketSkeleton("NUG", [], 120, 120).blank).toHaveLength(239);
    expect(bracketSkeleton("SWS", [], 120, 120).blank).toHaveLength(0);
  });

  it("skips slots that exist and fills a side an earlier result decides", () => {
    const known = [{ comp: "BSA", stage: "KO", round: "R1", slot: 1, winner: "x", score: "2–0" }];
    const { blank, order } = bracketSkeleton("BSA", known, 120, 120);
    expect(blank).toHaveLength(14);
    expect(order).toHaveLength(15);
    expect(blank.find((c) => c.a === "x" || c.b === "x")?.round).toBe("QF");
  });
});
