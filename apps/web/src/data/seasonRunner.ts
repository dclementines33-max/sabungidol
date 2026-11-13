// Playing the current season in the Worker (Fase 3, PRD §8 "kontrol simulasi"): the engine replays
// the season from the saved results and plays only what the target allows, in chunks so progress
// shows and Pause works; each round is saved in its own transaction (PRD §13); matches whose pairing
// changed after a manual result are removed.
import { type Db, type SeasonRow, currentSeason, listSeasons, deleteMatches, leagueRosters, listIdols, listSeasonMatches, saveMatches } from "@sabung/db";
import { type MatchRef, type SeasonInput, type SimMatch, computeStandings, runSeason } from "@sabung/engine";
import { bracketSkeleton } from "./bracketSkeleton";
import { D1_LEAGUES, D2_LEAGUES, SEASON_COMPETITIONS, type StageCode, competitionKeyOf, readSeasonConfig } from "@sabung/shared";
import { seasonMatches } from "./seasonMatches";

export type PlayTarget =
  | { kind: "all" } // the whole season
  | { kind: "phase" } // until the current phase (leagues → cups → gala) is finished
  | { kind: "stage"; comp: string; stage: string }
  | { kind: "round"; comp: string; stage: string; round: string } // a matchday or a cup round
  | { kind: "ids"; ids: string[] } // single matches
  | { kind: "comps"; comps: string[]; round?: string }; // everything left in these competitions (a cup to its end), or one round
                                                       // of them; "R1" also means every group's "A-R1", "B-R1"…
export type PlayProgress = { done: number; total: number };

const CHUNK = 1000;
const GALA = new Set(["DSG", "MBK"]);
let pauseRequested = false;
export const requestPause = () => { pauseRequested = true; };

// The current live season, or a given (archived) one for rating sources.
export async function seasonInput(db: Db, given?: SeasonRow): Promise<SeasonInput & { seasonId: string }> {
  const season = given ?? await currentSeason(db);
  if (!season || (!given && season.status !== "live")) throw new Error("Belum ada season yang berjalan. Mulai season dulu.");
  const config = readSeasonConfig(season.config);
  // Ratings are fixed within a season: an idol who already played keeps the rating stored with those
  // matches, so a later rating change (progression, Rating Manager) never reseeds what was played.
  const played = new Map<string, number>();
  for (const m of await seasonMatches(db, season.id)) played.set(m.idolA, m.ratingA).set(m.idolB, m.ratingB);
  const idols = (await listIdols(db)).map((i) => ({ id: i.id, groupId: i.groupId, rating: played.get(i.id) ?? i.rating, active: i.active }));
  const { IDL: theIdols, ...leagues } = await leagueRosters(db, season.id); // The Idols was fixed when the season started
  return { seasonId: season.id, season: season.number, seed: season.seed, idols, leagues: leagues as SeasonInput["leagues"], theIdols, config, tuning: config.tuning };
}

// Where the season stands, nothing played: titles so far, what can be played next, and per
// competition off / not started / running / finished (a running competition always has its next
// match in the frontier; a finished one never does).
export async function seasonOverview(db: Db) {
  const input = await seasonInput(db);
  const result = runSeason({ ...input, saved: await seasonMatches(db, input.seasonId), target: () => false });
  const off = new Set(input.config?.off ?? []);
  const played = new Map<string, number>();
  for (const m of result.matches) played.set(competitionKeyOf(m.comp), (played.get(competitionKeyOf(m.comp)) ?? 0) + 1);
  const waiting = new Set(result.pending.map((m) => competitionKeyOf(m.comp)));
  const competitions = SEASON_COMPETITIONS.map((c) => {
    const n = played.get(c.key) ?? 0;
    // Daesang + Music Bank open the season with last season's champions: none in Season 1 (not a blocker).
    const none = GALA.has(c.key) && !input.config?.opener?.[c.key as "DSG" | "MBK"];
    const status = off.has(c.key) ? "off" : none ? "none" : waiting.has(c.key) ? (n ? "running" : "next") : n ? "finished" : "waiting";
    return { key: c.key, name: c.name, played: n, status } as const;
  });
  const third = result.matches.find((m) => m.comp === "UZC" && m.round === "3RD");
  return {
    titles: result.titles, pending: result.pending, done: result.done, played: result.matches.length, notices: result.notices, competitions,
    uzcThird: third ? (third.result === "A" ? third.idolA : third.idolB) : null,
  };
}

export function allows(target: PlayTarget, frontier: MatchRef[]): (m: MatchRef) => boolean {
  switch (target.kind) {
    case "all": return () => true;
    case "stage": return (m) => m.comp === target.comp && m.stage === target.stage;
    case "round": return (m) => m.comp === target.comp && m.stage === target.stage && m.round === target.round;
    case "ids": { const ids = new Set(target.ids); return (m) => ids.has(m.id); }
    case "comps": { const r = target.round; return (m) => target.comps.includes(m.comp) && (!r || m.round === r || m.round.endsWith(`-${r}`)); }
    case "phase": {
      if (frontier.some((m) => GALA.has(m.comp))) return (m) => GALA.has(m.comp); // the opener comes first
      if (frontier.some((m) => m.stage === "LG")) return (m) => m.stage === "LG";
      return () => true;
    }
  }
}

export async function playSeason(db: Db, target: PlayTarget, onProgress: (p: PlayProgress) => void) {
  pauseRequested = false;
  const input = await seasonInput(db);
  let saved: SimMatch[] = await listSeasonMatches(db, input.seasonId); // fresh: playSeason extends it as it saves
  const frontier = runSeason({ ...input, saved, target: () => false }).pending;
  const allowed = allows(target, frontier);
  const estimate = target.kind === "all" ? 5600 : target.kind === "ids" ? target.ids.length : frontier.filter(allowed).length;
  let added = 0;
  let removed = 0;
  for (;;) {
    let budget = CHUNK;
    const result = runSeason({ ...input, saved, target: (m) => allowed(m) && budget-- > 0 });
    if (result.stale.length) { await deleteMatches(db, input.seasonId, result.stale); removed += result.stale.length; }
    const known = new Set(saved.map((m) => m.id));
    const fresh = result.matches.filter((m) => !known.has(m.id));
    const rounds = new Map<string, SimMatch[]>();
    for (const m of fresh) rounds.set(`${m.comp}-${m.stage}-${m.round}`, [...(rounds.get(`${m.comp}-${m.stage}-${m.round}`) ?? []), m]);
    for (const batch of rounds.values()) await saveMatches(db, input.seasonId, batch);
    added += fresh.length;
    saved = result.matches;
    onProgress({ done: added, total: Math.max(estimate, added) });
    if (result.done || fresh.length === 0 || pauseRequested) {
      return { added, removed, done: result.done, paused: pauseRequested && !result.done && fresh.length > 0, pending: result.pending.length, titles: result.titles, notices: result.notices };
    }
  }
}

// One league's view (Fase 3 panels): standings, form (last 5 league results), position after every
// matchday (for the sparkline), and all 38 matchdays — played or still open. Nothing is played.
export async function leagueView(db: Db, comp: string) {
  const input = await seasonInput(db);
  const result = runSeason({ ...input, saved: await seasonMatches(db, input.seasonId), target: () => false });
  const roster = comp === "IDL" ? (input.theIdols ?? []) : (input.leagues as Record<string, string[]>)[comp] ?? [];
  const played = result.matches.filter((m) => m.comp === comp && m.stage === "LG");
  const start = roster.map((id) => ({ id, startRating: input.idols.find((i) => i.id === id)?.rating ?? 0 }));
  const md = (round: string) => Number(round.slice(2));
  const lastMd = Math.max(0, ...played.map((m) => md(m.round)));
  const positions: Record<string, number[]> = Object.fromEntries(roster.map((id) => [id, []]));
  for (let n = 1; n <= lastMd; n++) {
    for (const row of computeStandings(start, played.filter((m) => md(m.round) <= n))) positions[row.idolId]!.push(row.rank);
  }
  const form: Record<string, ("W" | "D" | "L")[]> = Object.fromEntries(roster.map((id) => [id, []]));
  for (const m of [...played].sort((a, b) => md(a.round) - md(b.round))) {
    form[m.idolA]!.push(m.result === "D" ? "D" : m.result === "A" ? "W" : "L");
    form[m.idolB]!.push(m.result === "D" ? "D" : m.result === "B" ? "W" : "L");
  }
  const fixtures = new Map<string, { id: string; idolA: string; idolB: string; scoreA?: number; scoreB?: number }[]>();
  const open = result.pending.filter((p) => p.comp === comp && p.stage === "LG").map((p) => ({ ...p, scoreA: undefined, scoreB: undefined }));
  for (const m of [...played, ...open]) {
    fixtures.set(m.round, [...(fixtures.get(m.round) ?? []), { id: m.id, idolA: m.idolA, idolB: m.idolB, scoreA: m.scoreA, scoreB: m.scoreB }]);
  }
  return {
    roster,
    standings: computeStandings(start, played),
    positions,
    form: Object.fromEntries(Object.entries(form).map(([id, f]) => [id, f.slice(-5)])),
    fixtures: [...fixtures.entries()].sort(([a], [b]) => md(a) - md(b)).map(([round, matches]) => ({ round, matches: matches.sort((x, y) => x.id.localeCompare(y.id)) })),
  };
}

// id "" = a slot whose match does not exist yet (the bracket is drawn whole from the start).
export type CupCell = { key: string; id: string; comp: string; stage: StageCode; round: string; slot: number; a: string; b: string; winner?: string; score?: string };

// Cups (Fase 3 panels): their matches outside the league stage — played, or ready to play next — as
// bracket cells, the draws (Swiss groups, pots, groups) and the group-stage tables.
export async function cupView(db: Db, comps: string[], seasonId?: string) {
  const given = seasonId ? (await listSeasons(db)).find((x) => x.id === seasonId) : undefined; // an archived season (Season Archive)
  const input = await seasonInput(db, given);
  const result = runSeason({ ...input, saved: await seasonMatches(db, input.seasonId), target: () => false });
  const mine = (m: { comp: string; stage: string }) => comps.includes(m.comp) && m.stage !== "LG";
  const played: CupCell[] = result.matches.filter(mine).map((m) => ({
    key: `${m.comp}-${m.stage}-${m.round}-${m.slot}`, id: m.id, comp: m.comp, stage: m.stage, round: m.round, slot: m.slot, a: m.idolA, b: m.idolB,
    winner: m.result === "A" ? m.idolA : m.result === "B" ? m.idolB : undefined, score: `${m.scoreA}–${m.scoreB}`,
  }));
  const open: CupCell[] = result.pending.filter(mine).map((m) => {
    const slot = Number(m.id.split("-M").at(-1));
    return { key: `${m.comp}-${m.stage}-${m.round}-${slot}`, id: m.id, comp: m.comp, stage: m.stage, round: m.round, slot, a: m.idolA, b: m.idolB };
  });
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const table = (ids: string[], stage: string, prefix: string) => computeStandings(ids.map((id) => ({ id, startRating: rating.get(id) ?? 0 })),
    result.matches.filter((m) => m.stage === stage && m.round.startsWith(`${prefix}-`)));
  const letter = (g: number) => "ABCDEFGHIJKLMNOP"[g]!;
  const leagues = input.leagues as Record<string, string[]>;
  const size = (codes: readonly string[]) => codes.reduce((n, c) => n + (leagues[c]?.length ?? 0), 0);
  const off = new Set(input.config?.off ?? []);
  const skeletons = comps.filter((c) => !off.has(competitionKeyOf(c))).map((c) => bracketSkeleton(c, [...played, ...open], size(D2_LEAGUES), size(D1_LEAGUES), result.entrants[c]));
  const order = new Map(skeletons.flatMap((s) => s.order).map((key, i) => [key, i]));
  const at = (c: CupCell) => order.get(c.key) ?? -1; // group / Swiss cells (no template) stay first, in play order
  return {
    cells: [...played, ...open, ...(skeletons.flatMap((s) => s.blank) as CupCell[])].sort((x, y) => at(x) - at(y)),
    titles: Object.fromEntries(Object.entries(result.titles).filter(([key]) => comps.some((c) => key === c || key.startsWith(`${c}-`) || key === `MBK-${c}`))),
    draws: result.draws,
    lcqTables: (result.draws.lcq ?? []).map((ids, g) => table(ids, "LQ", letter(g))),
    groupTables: (result.draws.groups ?? []).map((ids, g) => table(ids, "GS", letter(g))),
  };
}
