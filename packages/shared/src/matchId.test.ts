import { describe, expect, it } from "vitest";
import { buildMatchId, classifyMatch } from "./matchId";

describe("match id", () => {
  it("builds the PRD format", () => {
    expect(buildMatchId({ season: 3, comp: "D1B", stage: "LG", round: "MD17", slot: 4 })).toBe("S03-D1B-LG-MD17-M04");
  });

  it("round can contain dashes and still parses back", () => {
    const id = buildMatchId({ season: 3, comp: "UZC", stage: "GS", round: "C-MD2", slot: 1 });
    expect(id).toBe("S03-UZC-GS-C-MD2-M01");
    expect(classifyMatch(id)).toEqual({ season: 3, comp: "UZC", stage: "GS", round: "C-MD2", slot: 1 });
  });

  it("classifies by prefix only", () => {
    expect(classifyMatch("S12-NUG-KO-R3-M41")).toEqual({ season: 12, comp: "NUG", stage: "KO", round: "R3", slot: 41 });
  });

  it("rejects bad ids instead of guessing", () => {
    expect(() => classifyMatch("S03-XXX-LG-MD1-M01")).toThrow();
    expect(() => classifyMatch("S03-D1A-ZZ-MD1-M01")).toThrow();
    expect(() => classifyMatch("S03-D1A-LG-M01")).toThrow();
    expect(() => classifyMatch("matchday-1")).toThrow();
  });
});
