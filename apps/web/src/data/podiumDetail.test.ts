import { expect, it } from "vitest";
import { involves, seasonRecord } from "./podiumDetail";

it("counts W-D-L and win rate for one idol only", () => {
  const m = [{ idolA: "x", idolB: "y", result: "A" as const }, { idolA: "y", idolB: "x", result: "A" as const }, { idolA: "x", idolB: "z", result: "D" as const }, { idolA: "y", idolB: "z", result: "B" as const }];
  expect(seasonRecord(m, "x")).toEqual({ wins: 1, draws: 1, losses: 1, winRate: 0.5 });
  expect(seasonRecord(m, "nobody").winRate).toBe(0);
});
it("finds an idol in any story field", () => {
  expect(involves({ winner: "a", loser: "b" }, "b")).toBe(true);
  expect(involves({ idol: "a" }, "b")).toBe(false);
});
