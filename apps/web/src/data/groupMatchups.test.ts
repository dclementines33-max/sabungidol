import { describe, expect, it } from "vitest";
import { groupMatchups } from "./groupMatchups";

describe("group matchups", () => {
  const groupOf = new Map<string, string | null>([["a1", "A"], ["a2", "A"], ["b1", "B"], ["c1", "C"], ["solo", null]]);
  const pairs = {
    "a1|b1": { meetings: 3, winsLo: 2, winsHi: 1, draws: 0 },
    "a2|b1": { meetings: 2, winsLo: 0, winsHi: 1, draws: 1 },
    "a1|c1": { meetings: 1, winsLo: 1, winsHi: 0, draws: 0 },
    "a1|a2": { meetings: 4, winsLo: 3, winsHi: 1, draws: 0 },
    "a1|solo": { meetings: 5, winsLo: 5, winsHi: 0, draws: 0 },
  };

  it("sums the members' pairs per opposing group, from the group's side; soloists left out", () => {
    const { rivals } = groupMatchups(pairs, groupOf, "A");
    expect(rivals).toEqual([
      { groupId: "B", meetings: 5, wins: 2, draws: 1, losses: 2 },
      { groupId: "C", meetings: 1, wins: 1, draws: 0, losses: 0 },
    ]);
    expect(groupMatchups(pairs, groupOf, "B").rivals[0]).toEqual({ groupId: "A", meetings: 5, wins: 2, draws: 1, losses: 2 });
  });

  it("members against each other are the civil war", () => {
    expect(groupMatchups(pairs, groupOf, "A").civil).toEqual([{ a: "a1", b: "a2", meetings: 4, winsA: 3, winsB: 1, draws: 0 }]);
  });
});
