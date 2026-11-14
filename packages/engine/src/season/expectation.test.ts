import { describe, expect, it } from "vitest";
import { expectationParts, placeValue } from "./expectation";
import type { Placement } from "./placements";

// One D1 league of 20 idols rated 70..89 (d00 = 89 … d19 = 70); placements are built per test.
const ids = Array.from({ length: 20 }, (_, i) => `d${String(i).padStart(2, "0")}`);
const rating = (id: string) => 89 - Number(id.slice(1));
const leagues = { D1A: ids };
const none = { promoted: new Set<string>(), relegated: new Set<string>() };
const league = (order: string[]): Placement[] => order.map((idolId, i) => ({ comp: "D1A", idolId, finalRank: i + 1, tied: 1, stageReached: "LG" }));
const uzc = (entrants: { id: string; stage: string; rank: number }[]): Placement[] => entrants.map((e) => ({ comp: "UZC", idolId: e.id, finalRank: e.rank, tied: 1, stageReached: e.stage }));
const part = (parts: ReturnType<typeof expectationParts>, id: string, key: string) => parts.get(id)?.find((p) => p.key === key);

describe("expectation model", () => {
  it("place values: league rank, Unzure group exit, knockout places", () => {
    expect(placeValue({ comp: "D1A", idolId: "x", finalRank: 1, tied: 1, stageReached: "LG" })).toBe(100);
    expect(placeValue({ comp: "UZC", idolId: "x", finalRank: 33, tied: 32, stageReached: "GS" })).toBe(5);
    expect(placeValue({ comp: "INK", idolId: "x", finalRank: 1, tied: 1, stageReached: "W" })).toBe(100);
  });

  it("finishing as the rating expects is about zero; beating it is +, missing it is −", () => {
    const asExpected = expectationParts([], league(ids), leagues, rating, none);
    expect(Math.abs(part(asExpected, "d00", "D1A")?.delta ?? 0)).toBeLessThan(0.1);
    const swapped = [ids[10]!, ...ids.filter((id) => id !== ids[10])]; // the 79 wins the league, everyone above drops one place
    const parts = expectationParts([], league(swapped), leagues, rating, none);
    expect(part(parts, "d10", "D1A")!.delta).toBeGreaterThan(1); // a big over-achievement
    expect(part(parts, "d00", "D1A")?.delta ?? 0).toBeLessThanOrEqual(0); // one place lower: a small minus or nothing
    expect(part(parts, "d10", "D1A")!.stage).toBe("#1");
  });

  it("a D1 idol who misses the Unzure Cup, or goes out in its groups when rated to go far, loses rating", () => {
    const entrants = ids.slice(0, 12).map((id, i) => ({ id, stage: i === 0 ? "GS" : i < 4 ? "QF" : "R16", rank: i === 0 ? 30 : i < 4 ? 5 : 9 }));
    const parts = expectationParts([], [...league(ids), ...uzc(entrants)], leagues, rating, none);
    expect(part(parts, "d00", "UZC")).toMatchObject({ stage: "groups" });
    expect(part(parts, "d00", "UZC")!.delta).toBeLessThan(-1); // the 89 went out in the groups
    expect(part(parts, "d15", "UZC")).toMatchObject({ stage: "missed" });
  });

  it("the user's example: winning the league (+) and an Unzure group exit (−) roughly cancel", () => {
    const winner = ids[5]!; // rated 84
    const order = [winner, ...ids.filter((id) => id !== winner)];
    const entrants = ids.slice(0, 12).map((id, i) => ({ id, stage: id === winner ? "GS" : i < 4 ? "QF" : "R16", rank: id === winner ? 30 : i < 4 ? 5 : 9 }));
    const parts = expectationParts([], [...league(order), ...uzc(entrants)], leagues, rating, none);
    const league_ = part(parts, winner, "D1A")!.delta;
    const cup = part(parts, winner, "UZC")!.delta;
    expect(league_).toBeGreaterThan(0.5);
    expect(cup).toBeLessThan(-0.5);
    expect(Math.abs(league_ + cup)).toBeLessThan(Math.max(Math.abs(league_), Math.abs(cup))); // they offset
  });

  it("promotion, relegation and the breakdown order (biggest first)", () => {
    const parts = expectationParts([], league(ids), leagues, rating, { promoted: new Set(["d19"]), relegated: new Set(["d00"]) });
    expect(part(parts, "d19", "move")).toMatchObject({ stage: "promoted", delta: 1 });
    expect(part(parts, "d00", "move")).toMatchObject({ stage: "relegated", delta: -1 });
    const list = parts.get("d00")!;
    expect(list.every((p, i) => i === 0 || Math.abs(p.delta) <= Math.abs(list[i - 1]!.delta))).toBe(true);
  });
});
