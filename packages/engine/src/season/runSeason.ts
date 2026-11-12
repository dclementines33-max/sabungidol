// One full season, headless (PRD §4): league phase → cup phase (interleaved) → Gala Night.
import { B_SIDE_CUPS, D1_LEAGUES } from "@sabung/shared";
import { bSideCups, idolsPlayoff, inkigayoCup, nuguCup } from "./cups";
import { finish, interleave } from "./interleave";
import { playGala } from "./gala";
import { playLeaguePhase } from "./leaguePhase";
import { createMatchPlayer } from "./matchPlayer";
import type { SeasonInput, SeasonResult, Title } from "./types";
import { unzurePath } from "./unzurePath";

export function runSeason(input: SeasonInput): SeasonResult {
  const player = createMatchPlayer(input);
  const notices: string[] = [];
  const tables = playLeaguePhase(input, player);

  const [unzure, bSide, nugu, inkigayo, playoff] = finish(interleave<Title | Title[]>([
    unzurePath(input, player, tables, notices),
    bSideCups(player, tables),
    nuguCup(player, tables),
    inkigayoCup(player, tables),
    idolsPlayoff(player, tables),
  ])) as [Title, Title[], Title, Title, Title];
  const gala = playGala(player, tables, unzure, bSide, notices);

  const titles: SeasonResult["titles"] = { UZC: unzure, NUG: nugu, INK: inkigayo, "IDL-PO": playoff, DSG: gala.daesang };
  for (const [code, table] of Object.entries(tables)) titles[code] = { champion: table![0].idolId, runnerUp: table![1].idolId };
  B_SIDE_CUPS.forEach((code, i) => { titles[code] = bSide[i]; });
  D1_LEAGUES.forEach((code, i) => { titles[`MBK-${code}`] = gala.musicBank[i]; });
  return { matches: player.matches, titles, notices };
}
