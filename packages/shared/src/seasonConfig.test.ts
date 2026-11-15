import { describe, expect, it } from "vitest";
import { bestOfFor, brokenByOff, clampTuning, readSeasonConfig, seasonBestOf } from "./seasonConfig";

describe("season settings", () => {
  it("uses the PRD default BoN unless the season changes it", () => {
    const config = readSeasonConfig({ bestOf: { "UZC:KO": 7 } });
    expect(bestOfFor(config, "UZC", "KO")).toBe(7);
    expect(bestOfFor(config, "UZC", "GS")).toBe(4);
    expect(bestOfFor(readSeasonConfig(null), "D1", "LG")).toBe(4);
  });

  it("drops a BoN that does not exist (the stage keeps its default)", () => {
    expect(bestOfFor(readSeasonConfig({ bestOf: { "D1:LG": 6 } }), "D1", "LG")).toBe(4);
  });

  it("names the running competitions that need one that is off", () => {
    expect(brokenByOff(readSeasonConfig({ off: ["SWS"] }))).toEqual([
      { key: "LCQ", missing: ["SWS"] },
      { key: "UZC", missing: ["SWS"] },
    ]);
    expect(brokenByOff(readSeasonConfig({ off: ["SWS", "LCQ", "UZC", "DSG"] }))).toEqual([]);
  });
});

describe("engine tuning in the season config", () => {
  it("defaults to the PRD constants and clamps values out of range", () => {
    expect(readSeasonConfig({}).tuning).toEqual({ scale: 40, sigma: 4 });
    expect(readSeasonConfig({ tuning: { scale: 5, sigma: 4 } }).tuning).toEqual({ scale: 10, sigma: 4 });
  });
});

describe("BoN per match", () => {
  it("uses the season override for the stage, else the default with its round rules", () => {
    const config = readSeasonConfig({ bestOf: { "NUG:KO": 5 } });
    expect(seasonBestOf(config, "NUG", "KO", "R1")).toBe(5);
    expect(seasonBestOf(undefined, "NUG", "KO", "SF")).toBe(5);
    expect(seasonBestOf(undefined, "NUG", "KO", "R1")).toBe(3);
    expect(seasonBestOf(readSeasonConfig({ bestOf: { "D1:LG": 5 } }), "D1C", "LG")).toBe(5);
  });

  it("Engine Tuning is clamped to its safe range; junk falls back to the default", () => {
    expect(clampTuning({ scale: 100000, sigma: -5 })).toEqual({ scale: 100, sigma: 0 });
    expect(clampTuning({ scale: Number.NaN, sigma: "8" })).toEqual({ scale: 40, sigma: 4 });
    expect(clampTuning(null)).toEqual({ scale: 40, sigma: 4 });
    expect(clampTuning({ scale: 55, sigma: 6 })).toEqual({ scale: 55, sigma: 6 });
  });

  it("a corrupt saved config never throws: each bad field is repaired, the good ones kept (2026-11-16 soft lock)", () => {
    const bad = { off: ["SWS", 7, "NOPE"], bestOf: { "UZC:KO": 7, "D1:LG": 9, "INK:KO": "x" }, tuning: { scale: 100000, sigma: Infinity }, opener: { DSG: "broken" } };
    const config = readSeasonConfig(bad);
    expect(config).toEqual({ off: ["SWS"], bestOf: { "UZC:KO": 7 }, tuning: { scale: 100, sigma: 4 } });
    for (const raw of ["garbage", 42, [], { tuning: "x" }, { bestOf: null, off: "SWS" }]) expect(() => readSeasonConfig(raw)).not.toThrow();
    expect(readSeasonConfig({ tuning: { scale: 60, sigma: 8 } }).tuning).toEqual({ scale: 60, sigma: 8 }); // valid stays as is
  });
});
