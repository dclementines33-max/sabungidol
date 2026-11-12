import { describe, expect, it } from "vitest";
import { groupColour } from "./IdolDataProvider";

describe("placeholder colour per group", () => {
  it("is one of the 12 branding colours, the same every time for a group", () => {
    const colour = groupColour("01JABCDEFGHJKMNPQRSTVWXYZ0");
    expect(colour).toMatch(/^brand-(gold|amber|coral|rose|orchid|violet|indigo|sky|teal|sage|lime|sand)$/);
    expect(groupColour("01JABCDEFGHJKMNPQRSTVWXYZ0")).toBe(colour);
  });

  it("soloists have none (the neutral placeholder)", () => {
    expect(groupColour(null)).toBeUndefined();
  });

  it("spreads groups over several colours", () => {
    const colours = new Set(Array.from({ length: 43 }, (_, i) => groupColour(`group-${i}`)));
    expect(colours.size).toBeGreaterThanOrEqual(8);
  });
});
