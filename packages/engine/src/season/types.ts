// What goes into and comes out of one simulated season.
import type { CompetitionCode, StageCode } from "@sabung/shared";
import type { Tuning } from "../series";

export type SeasonIdol = { id: string; groupId: string | null; rating: number; active: boolean };
export type LeagueCode = Extract<CompetitionCode, `D1${string}` | `D2${string}`>;

export type SeasonInput = {
  season: number;
  seed: string;
  idols: SeasonIdol[];
  leagues: Record<LeagueCode, string[]>; // 20 idol ids per league
  tuning?: Tuning;
};

export type SimMatch = {
  id: string; comp: CompetitionCode; stage: StageCode; round: string; slot: number;
  idolA: string; idolB: string; games: ("A" | "B")[]; scoreA: number; scoreB: number; result: "A" | "B" | "D";
  ratingA: number; ratingB: number; formA: string; formB: string;
};

export type Title = { champion: string; runnerUp: string };

export type SeasonResult = {
  matches: SimMatch[];
  titles: Partial<Record<string, Title>>; // key = competition code, or "IDL-PO" for The Idols playoff
  notices: string[]; // things the user must be told (fallbacks, clashes)
};
