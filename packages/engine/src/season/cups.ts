// Cups that run alongside the Unzure path (PRD §4): B-Side ×6, Nugu, Inkigayo, The Idols playoff.
import { B_SIDE_CUPS, D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { type BracketMatch, bracketRounds } from "../bracket";
import { idolsPlayoffTemplate, inkigayoTemplate } from "../doubleElimination";
import { knockoutTemplate } from "../knockout";
import { nuguEntryPlan } from "../nuguPlan";
import type { StandingRow } from "../standings";
import { crossLeague } from "./crossLeague";
import { interleave } from "./interleave";
import type { LeagueTables } from "./leaguePhase";
import type { MatchPlayer } from "./matchPlayer";
import type { Title } from "./types";

type Comp = Parameters<MatchPlayer["playKo"]>[0];

function* cup(player: MatchPlayer, comp: Comp, template: BracketMatch[], entrants: string[]): Generator<void, Title> {
  const results = yield* bracketRounds(template, entrants, (m, a, b) => player.playKo(comp, m.stage, m.round, m.slot, a, b));
  const final = results.at(-1)!;
  return { champion: final.winner, runnerUp: final.loser };
}

// Best first: league rank, then the cross-league rule (user decision: Nugu pairs by rank).
function byRank(player: MatchPlayer, rows: StandingRow[]): string[] {
  return rows.map((row) => ({ row, rating: player.rating(row.idolId) }))
    .sort((x, y) => x.row.rank - y.row.rank || crossLeague(x, y)).map((x) => x.row.idolId);
}

// B-Side: top 16 of each D1 league, 1 v 16, 8 v 9 ... All six cups advance together.
export function* bSideCups(player: MatchPlayer, tables: LeagueTables): Generator<void, Title[]> {
  return yield* interleave(D1_LEAGUES.map((code, i) =>
    cup(player, B_SIDE_CUPS[i], knockoutTemplate([16], { pairing: "seed" }), tables[code]!.slice(0, 16).map((r) => r.idolId))));
}

// Nugu: all D2 idols in round 1; D1 idols enter in round 2 or 3, the best ones latest.
export function* nuguCup(player: MatchPlayer, tables: LeagueTables): Generator<void, Title> {
  const d2 = byRank(player, D2_LEAGUES.flatMap((code) => tables[code]!));
  const d1 = byRank(player, D1_LEAGUES.flatMap((code) => tables[code]!));
  const plan = nuguEntryPlan(d2.length, d1.length, 9);
  const round3 = d1.slice(0, plan[2]);
  const round2 = d1.slice(plan[2]);
  return yield* cup(player, "NUG", knockoutTemplate(plan, { pairing: "seed" }), [...d2, ...round2, ...round3]);
}

// Inkigayo: the six D1 champions, seeded by league points.
export function* inkigayoCup(player: MatchPlayer, tables: LeagueTables): Generator<void, Title> {
  const champions = D1_LEAGUES.map((code) => ({ row: tables[code]![0], rating: player.rating(tables[code]![0].idolId) }))
    .sort(crossLeague).map((x) => x.row.idolId);
  return yield* cup(player, "INK", inkigayoTemplate(), champions);
}

// The Idols playoff: top 10 of The Idols league.
export function* idolsPlayoff(player: MatchPlayer, tables: LeagueTables): Generator<void, Title> {
  return yield* cup(player, "IDL", idolsPlayoffTemplate(), tables.IDL!.slice(0, 10).map((r) => r.idolId));
}
