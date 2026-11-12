// What goes into and comes out of one simulated season.
import type { CompetitionCode, SeasonConfig, StageCode } from "@sabung/shared";
import type { Tuning } from "../series";

export type SeasonIdol = { id: string; groupId: string | null; rating: number; active: boolean };
export type LeagueCode = Extract<CompetitionCode, `D1${string}` | `D2${string}`>;

export type SeasonInput = {
  season: number;
  seed: string;
  idols: SeasonIdol[];
  leagues: Record<LeagueCode, string[]>; // 20 idol ids per league
  theIdols?: string[]; // The Idols roster fixed when the season started; without it, picked by rating now
  tuning?: Tuning;
  config?: SeasonConfig; // Settings: BoN per stage, competitions switched off (tuning goes in tuning)
  // Replay (Fase 3): saved results are reused, not played again; a match that is not saved is only
  // played when target allows it, otherwise it is pending. Without target everything is played.
  saved?: SimMatch[];
  target?: (match: MatchRef) => boolean;
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
  pending: MatchRef[]; // reached but not played: what can be played next
  stale: string[]; // saved matches whose pairing no longer happens (an earlier result changed): to delete
  draws: Partial<Record<"swiss" | "lcq" | "pots" | "groups", string[][]>>; // what the Unzure path drew so far
  done: boolean; // every competition finished
};

// A match the replay reached but may not play yet (PRD §8 "kontrol simulasi"): what a panel offers next.
export type MatchRef = { id: string; comp: CompetitionCode; stage: StageCode; round: string; idolA: string; idolB: string };

// Thrown by the match player when a cup reaches a match it may not play; stops that track only.
export const PENDING = new Error("pending match");
