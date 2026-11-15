import { describe, expect, it } from "vitest";
import { arenaOf, defaultLeagueName } from "./arenaTheme";

describe("arena themes", () => {
  it("D2 and B-Side follow the D1 letter; Unzure parts and The Idols have their own", () => {
    expect(arenaOf("D1C")).toBe("sm");
    expect(arenaOf("D2C")).toBe("sm");
    expect(arenaOf("BSF")).toBe("west");
    expect(arenaOf("LCQ")).toBe("uzc");
    expect(arenaOf("IDL")).toBe("idl");
    expect(arenaOf("INK")).toBeUndefined();
  });
  it("default league names", () => {
    expect(defaultLeagueName("B")).toBe("HYBE. CO");
  });
});
