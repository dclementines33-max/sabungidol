// Gala Night (PRD §4): Daesang Cup and Music Bank Cup close the season.
// Clash rule: if one idol won both sides, the runner-up of the second competition plays instead.
import { D1_LEAGUES } from "@sabung/shared";
import type { LeagueTables } from "./leaguePhase";
import type { MatchPlayer } from "./matchPlayer";
import type { Title } from "./types";

function final(player: MatchPlayer, comp: "DSG" | "MBK", round: string, a: string, second: Title, label: string, notices: string[]): Title {
  const b = second.champion === a ? second.runnerUp : second.champion;
  if (b !== second.champion) notices.push(`${label}: ${a} won both sides, so the runner-up plays instead`);
  const won = player.playKo(comp, "FN", round, 1, a, b);
  return won === "A" ? { champion: a, runnerUp: b } : { champion: b, runnerUp: a };
}

// Daesang = The Idols league winner (Superleague, user decision) v Unzure Cup champion.
export function playGala(player: MatchPlayer, tables: LeagueTables, unzure: Title | undefined, bSide: Title[] | undefined, notices: string[]) {
  // A side switched off in Settings (or its feeder) skips that final.
  const daesang = unzure && tables.IDL ? final(player, "DSG", "F", tables.IDL[0].idolId, unzure, "Daesang Cup", notices) : undefined;
  const musicBank = bSide ? D1_LEAGUES.map((code, i) => final(player, "MBK", code, tables[code]![0].idolId, bSide[i]!, `Music Bank Cup ${code}`, notices)) : undefined;
  return { daesang, musicBank };
}
