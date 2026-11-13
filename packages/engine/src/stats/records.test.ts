import { describe, expect, it } from "vitest";
import { syntheticSeasons } from "../season/synthetic";
import { careerRows, foldSeason, isReverseSweep } from "./careerStats";
import { foldMatchRecords } from "./matchRecords";
import { allTimeRecords, rankLabel, rankRecords } from "./records";

describe("records engine (PRD §7.3)", () => {
  it("competition ranking 1, 2, T3, T3, 5 with the PRD tie order", () => {
    const ranked = rankRecords([
      { idolId: "e", value: 1, matches: 9 }, { idolId: "c", value: 5, matches: 10 }, { idolId: "d", value: 5, matches: 12 },
      { idolId: "a", value: 9, matches: 1 }, { idolId: "b", value: 7, matches: 1 },
    ], "total");
    expect(ranked.map((e) => `${e.idolId}:${rankLabel(e)}`)).toEqual(["a:#1", "b:#2", "d:#3 bersama", "c:#3 bersama", "e:#5"]); // totals: more matches first
    expect(rankRecords([{ idolId: "x", value: 0.7, matches: 60 }, { idolId: "y", value: 0.7, matches: 50 }], "percent").map((e) => e.idolId)).toEqual(["y", "x"]);
  });

  it("reverse sweep = won after trailing 0–2 (Bo5) or 0–3 (Bo7)", () => {
    expect(isReverseSweep({ games: ["B", "B", "A", "A", "A"], result: "A", scoreA: 3, scoreB: 2 })).toBe(true);
    expect(isReverseSweep({ games: ["A", "B", "B", "A", "A"], result: "A", scoreA: 3, scoreB: 2 })).toBe(false);
    expect(isReverseSweep({ games: ["B", "B", "B", "A", "A", "A", "A"], result: "A", scoreA: 4, scoreB: 3 })).toBe(true);
    expect(isReverseSweep({ games: ["B", "A", "A"], result: "A", scoreA: 2, scoreB: 1 })).toBe(false); // Bo3 never counts
  });

  it("on real seasons: win rate needs the minimum matches, upsets are sorted, pairs add up", () => {
    let state = {};
    let records = { pairs: {}, upsets: [] } as ReturnType<typeof foldMatchRecords>;
    let total = 0;
    for (const s of syntheticSeasons(2, "records")) {
      state = foldSeason(state, s.input.season, s.result.matches, s.placements);
      records = foldMatchRecords(records, s.input.season, s.result.matches);
      total += s.result.matches.length;
    }
    const rows = careerRows(state);
    const byId = Object.fromEntries(allTimeRecords(rows, { minMatches: 60 }).map((c) => [c.id, c]));
    expect(byId["win-rate"]!.entries.every((e) => e.matches >= 60)).toBe(true);
    expect(byId.titles!.entries[0]!.rank).toBe(1);
    expect(Object.values(records.pairs).reduce((n, p) => n + p.meetings, 0)).toBe(total);
    expect(records.upsets.map((u) => u.gap)).toEqual([...records.upsets.map((u) => u.gap)].sort((a, b) => b - a));
  });
});
