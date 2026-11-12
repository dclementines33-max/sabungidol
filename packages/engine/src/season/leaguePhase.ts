// Phase 1 (PRD §4): 12 leagues + The Idols, double round robin, all played matchday by matchday.
import type { CompetitionCode } from "@sabung/shared";
import { roundRobin } from "../roundRobin";
import { type StandingRow, computeStandings } from "../standings";
import type { MatchPlayer } from "./matchPlayer";
import type { SeasonInput } from "./types";

export type LeagueTables = Partial<Record<CompetitionCode, StandingRow[]>>;

// The Idols = 20 highest-rated active idols when the season is made; they also stay in their own league.
export function pickTheIdols(input: SeasonInput): string[] {
  return input.idols.filter((i) => i.active)
    .sort((x, y) => y.rating - x.rating || (x.id < y.id ? -1 : 1))
    .slice(0, 20).map((i) => i.id);
}

export function playLeaguePhase(input: SeasonInput, player: MatchPlayer, withTheIdols = true): LeagueTables {
  const rosters: [CompetitionCode, string[]][] = [...Object.entries(input.leagues) as [CompetitionCode, string[]][], ...(withTheIdols ? [["IDL", input.theIdols ?? pickTheIdols(input)] as [CompetitionCode, string[]]] : [])];
  for (const [code, ids] of rosters) if (ids.length !== 20) throw new Error(`${code} must have 20 idols, has ${ids.length}`);

  const schedules = rosters.map(([code, ids]) => [code, roundRobin(ids, { double: true })] as const);
  for (let md = 0; md < 38; md++) {
    for (const [code, rounds] of schedules) {
      rounds[md].forEach(([home, away], i) => player.play(code, "LG", `MD${String(md + 1).padStart(2, "0")}`, i + 1, home, away));
    }
  }

  const tables: LeagueTables = {};
  for (const [code, ids] of rosters) {
    const matches = player.matches.filter((m) => m.comp === code && m.stage === "LG")
      .map((m) => ({ idolA: m.idolA, idolB: m.idolB, scoreA: m.scoreA, scoreB: m.scoreB, result: m.result }));
    tables[code] = computeStandings(ids.map((id) => ({ id, startRating: player.rating(id) })), matches);
  }
  return tables;
}
