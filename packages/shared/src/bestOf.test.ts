import { describe, expect, it } from "vitest";
import { defaultBestOf } from "./bestOf";

describe("default best of", () => {
  it("follows the PRD §4 table", () => {
    expect(defaultBestOf("D1A", "LG")).toBe(4);
    expect(defaultBestOf("D2F", "LG")).toBe(4);
    expect(defaultBestOf("IDL", "UB")).toBe(5);
    expect(defaultBestOf("IDL", "FN")).toBe(7);
    expect(defaultBestOf("SWS", "SW")).toBe(3);
    expect(defaultBestOf("LCQ", "LQ")).toBe(3);
    expect(defaultBestOf("UZC", "GS")).toBe(4);
    expect(defaultBestOf("UZC", "KO")).toBe(5);
    expect(defaultBestOf("UZC", "FN")).toBe(7);
    expect(defaultBestOf("INK", "LB")).toBe(5);
    expect(defaultBestOf("NUG", "KO")).toBe(3);
    expect(defaultBestOf("NUG", "KO", "SF")).toBe(5);
    expect(defaultBestOf("NUG", "FN")).toBe(7);
    expect(defaultBestOf("BSC", "KO")).toBe(3);
    expect(defaultBestOf("BSC", "FN")).toBe(5);
    expect(defaultBestOf("DSG", "FN")).toBe(7);
    expect(defaultBestOf("MBK", "FN")).toBe(5);
  });

  it("throws for a stage the competition does not have", () => {
    expect(() => defaultBestOf("D1A", "KO")).toThrow();
  });
});
