import type { IdolRow } from "@sabung/db";
import type { CareerRow } from "@sabung/engine";
import { expect, it } from "vitest";
import { groupStats } from "./groupStats";

const idol = (id: string, groupId: string | null, rating: number, active = true) => ({ id, name: id, groupId, groupName: groupId && `G-${groupId}`, rating, active }) as IdolRow;
const line = (idolId: string, titles: number, wins: number, draws: number, matches: number) => ({ idolId, titles, wins, draws, matches }) as CareerRow;

it("sums titles and win rate per group, picks the best member, skips soloists", () => {
  const stats = groupStats([idol("a", "g", 80), idol("b", "g", 90, false), idol("s", null, 99)], [line("a", 2, 6, 2, 10), line("b", 0, 2, 0, 10)]);
  expect(stats).toEqual([{ id: "g", name: "G-g", members: ["a", "b"], active: 1, titles: 2, winRate: 0.45, best: "a", avgRating: 85 }]);
});
