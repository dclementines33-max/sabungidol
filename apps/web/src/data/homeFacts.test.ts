import type { CareerRow } from "@sabung/engine";
import { describe, expect, it } from "vitest";
import { homeFacts, homeLeaders } from "./homeFacts";

const row = (idolId: string, comp: string, over: Partial<CareerRow>) => ({ idolId, comp, matches: 0, wins: 0, losses: 0, titles: 0, winRate: 0, bestWinStreak: 0, bestUnbeatenStreak: 0, reverseSweeps: 0, giantKills: 0, finals: 0, ...over }) as CareerRow;

describe("home numbers", () => {
  const rows = [
    row("a", "ALL", { matches: 30, wins: 20, losses: 5, titles: 3, winRate: 0.7, bestWinStreak: 9 }),
    row("b", "ALL", { matches: 50, wins: 25, losses: 20, titles: 1, winRate: 0.5 }),
    row("c", "ALL", { matches: 5, wins: 5, winRate: 1 }), // too few matches for the win-rate record
    row("a", "D1", { titles: 1 }), row("b", "D2", { titles: 2 }), row("b", "UZC", { titles: 1 }),
  ];

  it("names one leader per category, league titles summed over both divisions", () => {
    const by = Object.fromEntries(homeLeaders(rows).map((l) => [l.label, l.idolId]));
    expect(by).toMatchObject({ "Gelar terbanyak (semua)": "a", "Gelar Unzure Cup": "b", "Gelar liga": "b", "Match terbanyak": "b", "Kalah terbanyak": "b", "Win rate tertinggi": "a" });
    expect(by["Gelar The Idols"]).toBeUndefined(); // nobody has one yet
  });

  it("facts: the pair met most often and the biggest upset", () => {
    const facts = homeFacts(rows, { "a|b": { meetings: 7, winsLo: 4, winsHi: 2, draws: 1 } }, [{ matchId: "m", season: 2, winner: "c", loser: "a", gap: 21 }]);
    expect(facts[0]).toMatchObject({ ids: ["a", "b"], value: "7 kali bertemu · 4–1–2" });
    expect(facts[1]?.ids).toEqual(["c", "a"]);
  });
});
