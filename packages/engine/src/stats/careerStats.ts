// Career stats (PRD §7.1), per idol per competition and Combined ("ALL"). Built by folding finished
// seasons in order into a running state; streaks carry on across seasons. The same fold, from zero, is
// "Rebuild Stats" — so the cache and a rebuild are identical by construction (Fase 4 gate).
import { competitionKeyOf } from "@sabung/shared";
import type { Placement } from "../season/placements";
import type { SimMatch } from "../season/types";

export type CareerLine = {
  matches: number; wins: number; draws: number; losses: number; gamesFor: number; gamesAgainst: number;
  winStreak: number; loseStreak: number; unbeatenStreak: number; bestWinStreak: number; bestLoseStreak: number; bestUnbeatenStreak: number;
  titles: number; runnerUp: number; third: number; fourth: number; groupExit: number; groupAdvance: number;
  placements: number; placementSum: number; bestPlacement: number | null; worstPlacement: number | null;
  leaguePoints: number; highestRating: number; seasons: number; lastSeason: number;
};
export type CareerState = Record<string, CareerLine>; // key: `${idolId}|${competition key or ALL}`

const empty = (): CareerLine => ({
  matches: 0, wins: 0, draws: 0, losses: 0, gamesFor: 0, gamesAgainst: 0,
  winStreak: 0, loseStreak: 0, unbeatenStreak: 0, bestWinStreak: 0, bestLoseStreak: 0, bestUnbeatenStreak: 0,
  titles: 0, runnerUp: 0, third: 0, fourth: 0, groupExit: 0, groupAdvance: 0,
  placements: 0, placementSum: 0, bestPlacement: null, worstPlacement: null,
  leaguePoints: 0, highestRating: 0, seasons: 0, lastSeason: 0,
});
const compOf = (code: string) => competitionKeyOf(code.split("-")[0]!);

// Matches in the order they were played (the engine replay's order).
export function foldSeason(previous: CareerState, season: number, matches: SimMatch[], placements: Placement[]): CareerState {
  const state: CareerState = structuredClone(previous);
  const lines = (idol: string, comp: string) => [`${idol}|${comp}`, `${idol}|ALL`].map((key) => (state[key] ??= empty()));
  for (const m of matches) {
    for (const side of ["A", "B"] as const) {
      const idol = side === "A" ? m.idolA : m.idolB;
      const outcome = m.result === "D" ? "D" : m.result === side ? "W" : "L";
      for (const l of lines(idol, competitionKeyOf(m.comp))) {
        l.matches++;
        l.gamesFor += side === "A" ? m.scoreA : m.scoreB;
        l.gamesAgainst += side === "A" ? m.scoreB : m.scoreA;
        l.highestRating = Math.max(l.highestRating, side === "A" ? m.ratingA : m.ratingB);
        if (l.lastSeason !== season) { l.seasons++; l.lastSeason = season; }
        if (outcome === "W") { l.wins++; l.winStreak++; l.loseStreak = 0; l.unbeatenStreak++; }
        else if (outcome === "L") { l.losses++; l.loseStreak++; l.winStreak = 0; l.unbeatenStreak = 0; }
        else { l.draws++; l.winStreak = 0; l.loseStreak = 0; l.unbeatenStreak++; }
        l.bestWinStreak = Math.max(l.bestWinStreak, l.winStreak);
        l.bestLoseStreak = Math.max(l.bestLoseStreak, l.loseStreak);
        l.bestUnbeatenStreak = Math.max(l.bestUnbeatenStreak, l.unbeatenStreak);
      }
    }
  }
  for (const p of placements) {
    for (const l of lines(p.idolId, compOf(p.comp))) {
      if (p.finalRank === 1) l.titles++;
      else if (p.finalRank === 2) l.runnerUp++;
      else if (p.finalRank === 3) l.third++;
      else if (p.finalRank === 4) l.fourth++;
      if (p.comp === "UZC") { if (p.stageReached === "GS") l.groupExit++; else l.groupAdvance++; }
      l.placements++;
      l.placementSum += p.finalRank;
      l.bestPlacement = Math.min(l.bestPlacement ?? p.finalRank, p.finalRank);
      l.worstPlacement = Math.max(l.worstPlacement ?? p.finalRank, p.finalRank);
      l.leaguePoints += p.leaguePoints ?? 0;
    }
  }
  return state;
}

export type CareerRow = CareerLine & { idolId: string; comp: string; winRate: number; gameDiff: number; avgGames: number; avgPlacement: number | null };

export function careerRows(state: CareerState): CareerRow[] {
  return Object.entries(state).map(([key, l]) => {
    const [idolId, comp] = key.split("|") as [string, string];
    return {
      ...l, idolId, comp,
      winRate: l.matches ? (l.wins + 0.5 * l.draws) / l.matches : 0,
      gameDiff: l.gamesFor - l.gamesAgainst,
      avgGames: l.matches ? (l.gamesFor + l.gamesAgainst) / l.matches : 0,
      avgPlacement: l.placements ? l.placementSum / l.placements : null,
    };
  });
}
