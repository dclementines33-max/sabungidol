import { describe, expect, it } from "vitest";
import { syntheticSeasons } from "../season/synthetic";
import { type CareerState, careerRows, foldSeason } from "./careerStats";

const seasons = [...syntheticSeasons(3, "career")];

describe("career stats (PRD §7.1–7.2)", () => {
  it("adds up: W+D+L = matches, every match counted for both idols, one champion per competition", () => {
    let state: CareerState = {};
    for (const s of seasons) state = foldSeason(state, s.input.season, s.result.matches, s.placements);
    const all = careerRows(state).filter((r) => r.comp === "ALL");
    for (const r of all) expect(r.wins + r.draws + r.losses).toBe(r.matches);
    const played = seasons.reduce((n, s) => n + s.result.matches.length, 0);
    expect(all.reduce((n, r) => n + r.matches, 0)).toBe(2 * played);
    const champions = seasons.flatMap((s) => s.placements.filter((p) => p.finalRank === 1)).length;
    expect(all.reduce((n, r) => n + r.titles, 0)).toBe(champions);
    expect(champions).toBe(3 * Object.keys(seasons[0]!.result.titles).length); // one per title key per season
  });

  it("places: ties share a rank (two SF losers without a 3rd-place match are both 3rd), Unzure group exits", () => {
    const p = seasons[0]!.placements;
    const nuguSf = p.filter((x) => x.comp === "NUG" && x.stageReached === "SF");
    expect(nuguSf.map((x) => [x.finalRank, x.tied])).toEqual([[3, 2], [3, 2]]);
    expect(p.filter((x) => x.comp === "UZC" && x.stageReached === "GS")).toHaveLength(32);
    expect(new Set(p.map((x) => `${x.comp}|${x.idolId}`)).size).toBe(p.length); // one row per idol per competition
  });

  it("folding season by season equals folding all at once from zero (the Rebuild Stats rule)", () => {
    let incremental: CareerState = {};
    for (const s of seasons) incremental = JSON.parse(JSON.stringify(foldSeason(incremental, s.input.season, s.result.matches, s.placements)));
    const rebuilt = seasons.reduce<CareerState>((st, s) => foldSeason(st, s.input.season, s.result.matches, s.placements), {});
    expect(incremental).toEqual(rebuilt);
  });
});
