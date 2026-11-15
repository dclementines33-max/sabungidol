import { expect, it } from "vitest";
import { involves, seasonRecord } from "./podiumDetail";

it("counts W-D-L, win rate, games and the longest win run for one idol only", () => {
  const m = (idolA: string, idolB: string, result: "A" | "B" | "D", scoreA: number, scoreB: number) => ({ idolA, idolB, result, scoreA, scoreB });
  const list = [m("x", "y", "A", 3, 1), m("y", "x", "B", 0, 3), m("x", "z", "D", 2, 2), m("y", "x", "A", 3, 0), m("y", "z", "B", 1, 3)];
  expect(seasonRecord(list, "x")).toEqual({ wins: 2, draws: 1, losses: 1, winRate: 0.625, gamesWon: 8, gamesLost: 6, bestStreak: 2 });
  expect(seasonRecord(list, "nobody").winRate).toBe(0);
});
it("finds an idol in any story field", () => {
  expect(involves({ winner: "a", loser: "b" }, "b")).toBe(true);
  expect(involves({ idol: "a" }, "b")).toBe(false);
});
