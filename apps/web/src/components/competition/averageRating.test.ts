import { describe, expect, it } from "vitest";
import { averageRating } from "./averageRating";

describe("averageRating", () => {
  it("averages to one decimal", () => expect(averageRating([70, 75, 80, 71])).toBe("74.0"));
  it("rounds", () => expect(averageRating([70, 71, 71])).toBe("70.7"));
  it("is a dash for nobody", () => expect(averageRating([])).toBe("-"));
});
