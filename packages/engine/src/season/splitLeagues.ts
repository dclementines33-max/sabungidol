// Data Maker (PRD §8 Settings; rule approved 2026-11-13): sort active idols by rating (then name),
// the top 120 go to Division 1 and the next 120 to Division 2, each division dealt snake-style over
// its 6 leagues so the leagues are equally strong. Everyone below the 240th is a reserve.
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { snake } from "./crossLeague";
import type { LeagueCode } from "./types";

export type SplitIdol = { id: string; name: string; rating: number };
export type LeagueSplit = { leagues: Record<LeagueCode, string[]>; reserves: string[] };

const PER_LEAGUE = 20;
const PER_DIVISION = 6 * PER_LEAGUE;

export function splitLeagues(idols: SplitIdol[]): LeagueSplit {
  if (idols.length < 2 * PER_DIVISION) {
    throw new Error(`Pembagian liga butuh minimal ${2 * PER_DIVISION} idol aktif, sekarang ada ${idols.length}`);
  }
  const ranked = [...idols].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).map((i) => i.id);
  const d1 = snake(ranked.slice(0, PER_DIVISION), 6);
  const d2 = snake(ranked.slice(PER_DIVISION, 2 * PER_DIVISION), 6);
  const leagues = Object.fromEntries([
    ...D1_LEAGUES.map((code, i) => [code, d1[i]]),
    ...D2_LEAGUES.map((code, i) => [code, d2[i]]),
  ]) as Record<LeagueCode, string[]>;
  return { leagues, reserves: ranked.slice(2 * PER_DIVISION) };
}
