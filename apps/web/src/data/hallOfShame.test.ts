import type { CareerRow } from "@sabung/engine";
import { describe, expect, it } from "vitest";
import { hallOfShame } from "./hallOfShame";

const row = (idolId: string, over: Partial<CareerRow>) => ({ idolId, comp: "ALL", matches: 30, losses: 0, titles: 0, runnerUp: 0, winRate: 0.5, bestLoseStreak: 0, groupExit: 0, ...over }) as CareerRow;

describe("Hall of Shame", () => {
  const rows = [
    row("a", { losses: 20, winRate: 0.2, bestLoseStreak: 9, runnerUp: 3 }),
    row("b", { losses: 5, titles: 2, runnerUp: 4, winRate: 0.8 }),
    row("c", { matches: 5, losses: 5, winRate: 0 }), // too few matches for the win-rate list
  ];
  const by = (list: ReturnType<typeof hallOfShame>) => Object.fromEntries(list.map((c) => [c.id, c.entries]));

  it("ranks the categories nobody wants", () => {
    const shame = by(hallOfShame(rows, {}, [], new Map([["a", 92], ["b", 95]])));
    expect(shame.losses!.map((e) => e.ids[0])).toEqual(["a", "b", "c"]);
    expect(shame.losses![0]!.value).toBe("20 losses");
    expect(shame.rate!.map((e) => e.ids[0])).toEqual(["a", "b"]); // worst first, c left out
    expect(shame.bridesmaid!.map((e) => e.ids[0])).toEqual(["a"]); // b has titles
    expect(shame.silver![0]!.ids).toEqual(["b"]);
    expect(shame.paper![0]).toEqual({ ids: ["a"], value: "rated 92 · 0 titles" });
  });

  it("cursed matchups: one side never won or drew, three meetings at least; upsets suffered are counted", () => {
    const shame = by(hallOfShame(rows, { "a|b": { meetings: 4, winsLo: 0, winsHi: 4, draws: 0 }, "a|c": { meetings: 3, winsLo: 2, winsHi: 0, draws: 1 } },
      [{ matchId: "m1", season: 1, winner: "c", loser: "b", gap: 30 }, { matchId: "m2", season: 2, winner: "a", loser: "b", gap: 12 }], new Map()));
    expect(shame.cursed).toEqual([{ ids: ["a", "b"], value: "0–4 against" }]);
    expect(shame.magnet).toEqual([{ ids: ["b"], value: "2 big upsets suffered" }]);
    expect(shame.fall![0]!.ids).toEqual(["b", "c"]);
  });
});
