// The road to the Unzure Cup (PRD §4): Swiss Play-in → LCQ → 16 groups → round of 32.
// 36 direct (ranks 1–6) + 20 from Swiss + 8 from LCQ = 64.
import { D1_LEAGUES } from "@sabung/shared";
import { bracketRounds } from "../bracket";
import { drawGroups } from "../groupDraw";
import { knockoutTemplate } from "../knockout";
import { seedKnockout } from "../knockoutSeeding";
import { matchRng } from "../rng";
import { roundRobin } from "../roundRobin";
import { type StandingRow, computeStandings } from "../standings";
import { type SwissMatch, swissPairings, swissRecords } from "../swissPairing";
import { type RankedIdol, crossLeague, snake } from "./crossLeague";
import type { LeagueTables } from "./leaguePhase";
import type { MatchPlayer } from "./matchPlayer";
import type { SeasonInput, Title } from "./types";

const LETTERS = "ABCDEFGHIJKLMNOP";

export function* unzurePath(input: SeasonInput, player: MatchPlayer, tables: LeagueTables, notices: string[]): Generator<void, Title> {
  const rowOf = new Map(D1_LEAGUES.flatMap((code) => tables[code]!.map((row) => [row.idolId, row] as const)));
  const leagueOf = new Map(D1_LEAGUES.flatMap((code) => input.leagues[code].map((id) => [id, code] as const)));
  const groupIdOf = new Map(input.idols.map((i) => [i.id, i.groupId]));
  const ranked = (ids: string[]) => ids.map((id): RankedIdol => ({ row: rowOf.get(id)!, rating: player.rating(id) })).sort(crossLeague).map((r) => r.row.idolId);
  const atRank = (rank: number) => D1_LEAGUES.map((code) => tables[code]![rank - 1].idolId);

  // Swiss: ranks 7–16 of every league + the 4 best 17ths, snake-dealt into 4 groups of 16.
  const swissEntrants = ranked([...[7, 8, 9, 10, 11, 12, 13, 14, 15, 16].flatMap(atRank), ...ranked(atRank(17)).slice(0, 4)]);
  const swissGroups = snake(swissEntrants, 4);
  const history: SwissMatch[][] = swissGroups.map(() => []);
  for (let round = 1; ; round++) {
    const live = swissGroups.map((ids, g) => [...swissRecords(ids, history[g]).values()].some((r) => r.wins < 3 && r.losses < 3));
    if (!live.includes(true)) break;
    swissGroups.forEach((ids, g) => {
      if (!live[g]) return;
      const { pairs, fallback } = swissPairings(ids, history[g], matchRng(input.seed, `SWS-${LETTERS[g]}-R${round}`));
      if (fallback) notices.push(`Swiss group ${LETTERS[g]} round ${round}: no equal-record pairing, nearest record used`);
      pairs.forEach(([a, b], i) => history[g].push({ a, b, winner: player.playKo("SWS", "SW", `${LETTERS[g]}-R${round}`, i + 1, a, b) === "A" ? a : b }));
    });
    yield;
  }
  const finished = (w: number, l: number) => swissGroups.flatMap((ids, g) => [...swissRecords(ids, history[g])].filter(([, r]) => r.wins === w && r.losses === l).map(([id]) => id));
  const swiss30 = ranked(finished(3, 0));
  const swiss31 = ranked(finished(3, 1));

  // LCQ: the 12 idols on 3–2, 2 snake groups of 6, single round robin, top 4 of each go through.
  const lcqGroups = snake(ranked(finished(3, 2)), 2);
  const lcq = yield* roundRobinGroups(player, "LCQ", "LQ", lcqGroups);
  const lcqQualified = lcq.flatMap((table) => table.slice(0, 4).map((r) => r.idolId));

  // Pots (PRD §4) and the group draw.
  const thirds = ranked(atRank(3));
  const sixths = ranked(atRank(6));
  const pots = [
    [...atRank(1), ...atRank(2), ...thirds.slice(0, 4)],
    [...thirds.slice(4), ...atRank(4), ...atRank(5), ...sixths.slice(0, 2)],
    [...sixths.slice(2), ...swiss30, ...swiss31.slice(0, 4)],
    [...swiss31.slice(4), ...lcqQualified],
  ].map((pot) => pot.map((id) => ({ id, groupId: groupIdOf.get(id) ?? null, league: leagueOf.get(id)! })));
  const draw = drawGroups(pots, matchRng(input.seed, "UZC-DRAW"));
  if (draw.relaxed) notices.push("Unzure Cup draw: league mates had to share a group");

  const groupTables = yield* roundRobinGroups(player, "UZC", "GS", draw.groups.map((g) => g.map((x) => x.id)));
  const finishes = groupTables.map((table) => ({
    winner: { id: table[0].idolId, league: leagueOf.get(table[0].idolId)! },
    runnerUp: { id: table[1].idolId, league: leagueOf.get(table[1].idolId)! },
  }));
  const ko = seedKnockout(finishes, matchRng(input.seed, "UZC-KO-DRAW"));
  if (ko.relaxed) notices.push("Unzure Cup round of 32: league mates had to meet");

  const results = yield* bracketRounds(knockoutTemplate([32], { thirdPlace: true }), ko.pairs.flat(),
    (m, a, b) => player.playKo("UZC", m.stage, m.round, m.slot, a, b));
  const final = results.at(-1)!;
  return { champion: final.winner, runnerUp: final.loser };
}

// Single round robin in several groups at once (LCQ, Unzure groups); one matchday per yield.
function* roundRobinGroups(player: MatchPlayer, comp: "LCQ" | "UZC", stage: "LQ" | "GS", groups: string[][]): Generator<void, StandingRow[][]> {
  const schedules = groups.map((ids) => roundRobin(ids, { double: false }));
  const played = groups.map(() => [] as NonNullable<ReturnType<MatchPlayer["play"]>>[]);
  for (let md = 0; md < schedules[0].length; md++) {
    schedules.forEach((rounds, g) => rounds[md].forEach(([a, b], i) => played[g].push(player.play(comp, stage, `${LETTERS[g]}-MD${md + 1}`, i + 1, a, b)!)));
    yield;
  }
  return groups.map((ids, g) => computeStandings(ids.map((id) => ({ id, startRating: player.rating(id) })), played[g]));
}
