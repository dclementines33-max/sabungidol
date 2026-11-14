import type { IdolRow } from "@sabung/db";
import type { CareerRow } from "@sabung/engine";
import { expect, it } from "vitest";
import { groupStats } from "./groupStats";

const idol = (id: string, groupId: string | null, rating: number, active = true) => ({ id, name: id, groupId, groupName: groupId && `G-${groupId}`, rating, active }) as IdolRow;
const line = (idolId: string, titles: number, wins: number, draws: number, matches: number) => ({ idolId, titles, wins, draws, losses: matches - wins - draws, matches, gameDiff: wins - 1, winRate: (wins + draws / 2) / matches }) as CareerRow;

it("sums titles, record and titles per competition per group, ranks members, skips soloists", () => {
  const stats = groupStats([idol("b", "g", 90, false), idol("a", "g", 80), idol("s", null, 99)], [line("a", 2, 6, 2, 10), line("b", 0, 2, 0, 10)],
    [{ idolId: "a", comp: "UZC", titles: 1 }, { idolId: "a", comp: "D1", titles: 1 }, { idolId: "s", comp: "NUG", titles: 1 }]);
  expect(stats).toEqual([{
    id: "g", name: "G-g", members: ["a", "b"], active: 1, titles: 2, byComp: { UZC: 1, D1: 1 },
    matches: 20, wins: 8, draws: 2, losses: 10, winRate: 0.45, gameDiff: 6, best: "a", avgRating: 85, tiers: { S: 1, B: 1 },
  }]);
});
