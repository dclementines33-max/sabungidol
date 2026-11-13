import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { seasonStory } from "./seasonStory";

const m = (id: string, a: string, b: string, games: ("A" | "B")[], ratingA = 70, ratingB = 70): SimMatch => {
  const scoreA = games.filter((g) => g === "A").length;
  const scoreB = games.length - scoreA;
  return { id, comp: "D1A", stage: "LG", round: `MD${id.slice(-2)}`, slot: 1, idolA: a, idolB: b, games, scoreA, scoreB, result: scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "D", ratingA, ratingB, formA: "Steady", formB: "Steady" };
};

describe("season story", () => {
  it("finds upsets, reverse sweeps, streaks, first titles and the idol of the month", () => {
    const matches = [
      m("X-01", "a", "b", ["B", "B", "A", "A", "A"], 60, 80), // a: upset by 20 and a reverse sweep
      m("X-02", "a", "c", ["A", "A", "A"]),
      m("X-03", "b", "c", ["A", "B", "A", "B"]),
    ];
    const stories = seasonStory(matches, { D1A: { champion: "a", runnerUp: "b" }, UZC: { champion: "c", runnerUp: "a" } }, new Set(["c|UZC"]));
    expect(stories).toEqual([
      { kind: "first-title", idol: "a", title: "D1A", runnerUp: "b" },
      { kind: "upset", matchId: "X-01", winner: "a", loser: "b", gap: 20 },
      { kind: "reverse-sweep", matchId: "X-01", winner: "a", loser: "b" },
      { kind: "streak", matchId: "X-02", idol: "a", wins: 2 },
      { kind: "idol-of-month", idol: "a", from: 1, to: 10, wins: 2 },
    ]);
  });
});
