import { describe, expect, it } from "vitest";
import { rosterProblems } from "./rosterProblems";

const full = (prefix: string) => Array.from({ length: 20 }, (_, i) => `${prefix}${i}`);
const leagues = ["D1A", "D1B", "D1C", "D1D", "D1E", "D1F", "D2A", "D2B", "D2C", "D2D", "D2E", "D2F"];

describe("rosterProblems", () => {
  it("is empty for 12 clean leagues", () => {
    const rosters = Object.fromEntries(leagues.map((l) => [l, full(l)]));
    expect(rosterProblems(rosters, Object.values(rosters).flat(), (id) => id)).toEqual([]);
  });

  it("lists size, duplicates, shared and inactive idols per league", () => {
    const rosters = Object.fromEntries(leagues.map((l) => [l, full(l)]));
    rosters.D1A = [...full("D1A"), "D1A0", "D2B3"]; // 22: one twice, one also in D2B
    const active = Object.values(rosters).flat().filter((id) => id !== "D1C5");
    expect(rosterProblems(rosters, active, (id) => id)).toEqual([
      { league: "D1A", text: "22/20 idol (kelebihan 2)" },
      { league: "D1A", text: "Ganda: D1A0" },
      { league: "D1A", text: "Juga di liga lain: D2B3 (D2B)" },
      { league: "D1C", text: "Tidak aktif: D1C5" },
      { league: "D2B", text: "Juga di liga lain: D2B3 (D1A)" },
    ]);
  });
});
