import { describe, expect, it } from "vitest";
import type { SimMatch } from "../season/types";
import { clinchOf, seasonMoments } from "./seasonMoments";

const m = (id: string, over: Partial<SimMatch>) =>
  ({ id, comp: "D1A", stage: "LG", round: "MD01", slot: 1, idolA: "a", idolB: "b", games: ["A", "A"], scoreA: 2, scoreB: 0, result: "A", ratingA: 80, ratingB: 80, formA: "", formB: "", ...over }) as SimMatch;

// Four idols, double round robin (6 matchdays): "a" wins everything, the others draw.
function league(): SimMatch[] {
  const pairs = [[["a", "b"], ["c", "d"]], [["a", "c"], ["b", "d"]], [["a", "d"], ["b", "c"]]];
  const out: SimMatch[] = [];
  for (let day = 1; day <= 6; day++) for (const [x, y] of pairs[(day - 1) % 3]!) {
    out.push(m(`L${day}${x}`, { round: `MD${String(day).padStart(2, "0")}`, idolA: x!, idolB: y!, result: x === "a" ? "A" : "D" }));
  }
  return out;
}

describe("clinchOf", () => {
  it("finds the first matchday after which the leader can't be caught", () => {
    // After day 4: a = 12, best other ≤ 3 points with 2 left (+6) → 9 < 12. After day 3: a = 9 vs 2 + 9 = 11, not yet.
    expect(clinchOf(league())).toEqual({ idol: "a", matchday: 4, left: 2 });
  });
  it("no clinch when the race goes to the last day", () => {
    expect(clinchOf(league().filter((x) => Number(x.round.slice(2)) <= 3))).toBeNull();
  });
});

describe("seasonMoments", () => {
  it("big matches, shock exits and new champions, only from fresh matches", () => {
    const list = [
      m("big", { comp: "SWS", stage: "SW", ratingA: 95, ratingB: 93 }),
      m("shock", { comp: "INK", stage: "KO", round: "QF", result: "B", ratingA: 92, ratingB: 80, games: ["B", "B"], scoreA: 0, scoreB: 2 }),
      m("old-big", { comp: "SWS", stage: "SW", ratingA: 99, ratingB: 99 }),
    ];
    const got = seasonMoments(list, new Set(["big", "shock"]), { INK: { champion: "x", runnerUp: "y" }, UZC: { champion: "p", runnerUp: "q" } }, { UZC: { champion: "p", runnerUp: "q" } });
    expect(got.map((h) => h.story.kind)).toEqual(["big-match", "shock-exit", "champion"]);
    expect(got[1]!.story).toMatchObject({ winner: "b", loser: "a", gap: 12 });
    expect(got[2]!.story).toMatchObject({ idol: "x", title: "INK" });
  });
});
