// One season (PRD §4): league phase → cup phase (interleaved) → Gala Night. Headless, or as a replay
// (Fase 3): saved results are reused and only what input.target allows is played; the result says
// what is pending next and whether the season is done. Competitions switched off in Settings are skipped.
import { B_SIDE_CUPS, D1_LEAGUES } from "@sabung/shared";
import { bSideCups, idolsPlayoff, inkigayoCup, nuguCup } from "./cups";
import { finish, interleave } from "./interleave";
import { playGala } from "./gala";
import { playLeaguePhase } from "./leaguePhase";
import { createMatchPlayer } from "./matchPlayer";
import { PENDING, type SeasonInput, type SeasonResult, type Title } from "./types";
import { unzurePath } from "./unzurePath";

export function runSeason(input: SeasonInput): SeasonResult {
  const off = new Set(input.config?.off ?? []);
  const player = createMatchPlayer(input);
  const notices: string[] = [];
  const titles: SeasonResult["titles"] = {};
  const result = (done: boolean): SeasonResult => ({ matches: player.matches, titles, notices, pending: player.pending, stale: player.stale, draws: player.draws, done });

  const tables = playLeaguePhase(input, player, !off.has("IDL"));
  player.endLeaguePhase();
  if (player.pending.length) return result(false); // the cups start from the final league tables
  for (const [code, table] of Object.entries(tables)) titles[code] = { champion: table![0].idolId, runnerUp: table![1].idolId };

  // Same order as always, so a season without Settings stays exactly as before (golden test).
  const tracks = [
    ["UZC", !off.has("SWS") && !off.has("LCQ") && !off.has("UZC") ? unzurePath(input, player, tables, notices) : null],
    ["BS", !off.has("BS") ? bSideCups(player, tables) : null],
    ["NUG", !off.has("NUG") ? nuguCup(player, tables) : null],
    ["INK", !off.has("INK") ? inkigayoCup(player, tables) : null],
    ["IDL-PO", !off.has("IDL") ? idolsPlayoff(player, tables) : null],
  ] as const;
  const running = tracks.filter(([, track]) => track);
  const won = finish(interleave<Title | (Title | undefined)[]>(running.map(([, track]) => track!), { partial: true }));
  const cup = Object.fromEntries(running.map(([key], i) => [key, won[i]])) as Record<string, Title | (Title | undefined)[] | undefined>;
  for (const key of ["UZC", "NUG", "INK", "IDL-PO"]) if (cup[key]) titles[key] = cup[key] as Title;
  const bSide = cup.BS as (Title | undefined)[] | undefined;
  bSide?.forEach((title, i) => { if (title) titles[B_SIDE_CUPS[i]!] = title; });
  if (running.some(([key]) => !cup[key]) || bSide?.includes(undefined)) return result(false); // a cup is still waiting for a match

  try {
    const gala = playGala(player, tables, off.has("DSG") ? undefined : (cup.UZC as Title | undefined), off.has("MBK") ? undefined : (bSide as Title[] | undefined), notices);
    if (gala.daesang) titles.DSG = gala.daesang;
    gala.musicBank?.forEach((title, i) => { titles[`MBK-${D1_LEAGUES[i]}`] = title; });
  } catch (error) {
    if (error !== PENDING) throw error;
    return result(false);
  }
  return result(true);
}
