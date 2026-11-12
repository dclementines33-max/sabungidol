import { describe, expect, it } from "vitest";
import { checkRoster } from "./rosterCheck";

const twenty = Array.from({ length: 20 }, (_, i) => `i${i}`);
const leagueOf = (id: string) => (id === "i3" ? "D2C" : "D1A");

describe("league roster check", () => {
  it("20 different idols of this league is ok", () => {
    expect(checkRoster(twenty, "D1A", () => "D1A")).toEqual({ count: 20, duplicates: [], elsewhere: [], ok: true });
  });
  it("not 20 is not ok", () => {
    expect(checkRoster(twenty.slice(1), "D1A", () => "D1A").ok).toBe(false);
  });
  it("a duplicate is not ok", () => {
    const check = checkRoster([...twenty.slice(0, 19), "i0"], "D1A", () => "D1A"); // 20 entries, i0 twice
    expect(check.count).toBe(20);
    expect(check.duplicates).toEqual(["i0"]);
    expect(check.ok).toBe(false);
  });
  it("an idol in another league is a warning, not a block", () => {
    const check = checkRoster(twenty, "D1A", leagueOf);
    expect(check.elsewhere).toEqual([{ idolId: "i3", league: "D2C" }]);
    expect(check.ok).toBe(true);
  });
});
