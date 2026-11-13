// The career-stats columns (PRD §7.1), shared by the Idol Profile and the Career Stats table and its CSV.
import type { CareerRow } from "@sabung/engine";

export type CareerColumn = { id: string; header: string; value: (r: CareerRow) => number | string };
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export const CAREER_COLUMNS: CareerColumn[] = [
  { id: "titles", header: "Gelar", value: (r) => r.titles },
  { id: "runnerUp", header: "Runner-up", value: (r) => r.runnerUp },
  { id: "third", header: "Ke-3", value: (r) => r.third },
  { id: "fourth", header: "Ke-4", value: (r) => r.fourth },
  { id: "groupExit", header: "Gugur grup", value: (r) => r.groupExit },
  { id: "groupAdvance", header: "Lolos grup", value: (r) => r.groupAdvance },
  { id: "matches", header: "Match", value: (r) => r.matches },
  { id: "wdl", header: "M-S-K", value: (r) => `${r.wins}-${r.draws}-${r.losses}` },
  { id: "winRate", header: "Win rate", value: (r) => pct(r.winRate) },
  { id: "gamesFor", header: "Game +", value: (r) => r.gamesFor },
  { id: "gamesAgainst", header: "Game −", value: (r) => r.gamesAgainst },
  { id: "gameDiff", header: "Selisih", value: (r) => r.gameDiff },
  { id: "avgGames", header: "Game/match", value: (r) => r.avgGames.toFixed(2) },
  { id: "bestWinStreak", header: "Streak menang", value: (r) => r.bestWinStreak },
  { id: "bestLoseStreak", header: "Streak kalah", value: (r) => r.bestLoseStreak },
  { id: "bestUnbeatenStreak", header: "Tak terkalahkan", value: (r) => r.bestUnbeatenStreak },
  { id: "avgPlacement", header: "Rata posisi", value: (r) => r.avgPlacement?.toFixed(1) ?? "–" },
  { id: "bestPlacement", header: "Posisi terbaik", value: (r) => r.bestPlacement ?? "–" },
  { id: "worstPlacement", header: "Posisi terburuk", value: (r) => r.worstPlacement ?? "–" },
  { id: "leaguePoints", header: "Poin liga", value: (r) => r.leaguePoints },
  { id: "highestRating", header: "Rating tertinggi", value: (r) => r.highestRating },
  { id: "seasons", header: "Season", value: (r) => r.seasons },
];
