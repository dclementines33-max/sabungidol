import { describe, expect, it } from "vitest";
import { bestOfFor, brokenByOff, readSeasonConfig, seasonBestOf } from "./seasonConfig";

describe("season settings", () => {
  it("uses the PRD default BoN unless the season changes it", () => {
    const config = readSeasonConfig({ bestOf: { "UZC:KO": 7 } });
    expect(bestOfFor(config, "UZC", "KO")).toBe(7);
    expect(bestOfFor(config, "UZC", "GS")).toBe(4);
    expect(bestOfFor(readSeasonConfig(null), "D1", "LG")).toBe(4);
  });

  it("refuses a BoN that does not exist", () => {
    expect(() => readSeasonConfig({ bestOf: { "D1:LG": 6 } })).toThrow();
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
  it("defaults to the PRD constants and refuses values out of range", () => {
    expect(readSeasonConfig({}).tuning).toEqual({ scale: 40, sigma: 4 });
    expect(() => readSeasonConfig({ tuning: { scale: 5, sigma: 4 } })).toThrow();
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
});
