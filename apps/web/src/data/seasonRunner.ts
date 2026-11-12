// Playing the current season in the Worker (Fase 3, PRD §8 "kontrol simulasi"): the engine replays
// the season from the saved results and plays only what the target allows, in chunks so progress
// shows and Pause works; each round is saved in its own transaction (PRD §13); matches whose pairing
// changed after a manual result are removed.
import { type Db, currentSeason, deleteMatches, leagueRosters, listIdols, listSeasonMatches, saveMatches } from "@sabung/db";
import { type MatchRef, type SeasonInput, type SimMatch, runSeason } from "@sabung/engine";
import { SEASON_COMPETITIONS, competitionKeyOf, readSeasonConfig } from "@sabung/shared";

export type PlayTarget =
  | { kind: "all" } // the whole season
  | { kind: "phase" } // until the current phase (leagues → cups → gala) is finished
  | { kind: "stage"; comp: string; stage: string }
  | { kind: "round"; comp: string; stage: string; round: string } // a matchday or a cup round
  | { kind: "ids"; ids: string[] }; // single matches
export type PlayProgress = { done: number; total: number };

const CHUNK = 1000;
const GALA = new Set(["DSG", "MBK"]);
let pauseRequested = false;
export const requestPause = () => { pauseRequested = true; };

async function seasonInput(db: Db): Promise<SeasonInput & { seasonId: string }> {
  const season = await currentSeason(db);
  if (!season || season.status !== "live") throw new Error("Belum ada season yang berjalan. Mulai season dulu.");
  const config = readSeasonConfig(season.config);
  const idols = (await listIdols(db)).map((i) => ({ id: i.id, groupId: i.groupId, rating: i.rating, active: i.active }));
  const { IDL: theIdols, ...leagues } = await leagueRosters(db, season.id); // The Idols was fixed when the season started
  return { seasonId: season.id, season: season.number, seed: season.seed, idols, leagues: leagues as SeasonInput["leagues"], theIdols, config, tuning: config.tuning };
}

// Where the season stands, nothing played: titles so far, what can be played next, and per
// competition off / not started / running / finished (a running competition always has its next
// match in the frontier; a finished one never does).
export async function seasonOverview(db: Db) {
  const input = await seasonInput(db);
  const result = runSeason({ ...input, saved: await listSeasonMatches(db, input.seasonId), target: () => false });
  const off = new Set(input.config?.off ?? []);
  const played = new Map<string, number>();
  for (const m of result.matches) played.set(competitionKeyOf(m.comp), (played.get(competitionKeyOf(m.comp)) ?? 0) + 1);
  const waiting = new Set(result.pending.map((m) => competitionKeyOf(m.comp)));
  const competitions = SEASON_COMPETITIONS.map((c) => {
    const n = played.get(c.key) ?? 0;
    const status = off.has(c.key) ? "off" : waiting.has(c.key) ? (n ? "running" : "next") : n ? "finished" : "waiting";
    return { key: c.key, name: c.name, played: n, status } as const;
  });
  const third = result.matches.find((m) => m.comp === "UZC" && m.round === "3RD");
  return {
    titles: result.titles, pending: result.pending, done: result.done, played: result.matches.length, notices: result.notices, competitions,
    uzcThird: third ? (third.result === "A" ? third.idolA : third.idolB) : null,
  };
}

function allows(target: PlayTarget, frontier: MatchRef[]): (m: MatchRef) => boolean {
  switch (target.kind) {
    case "all": return () => true;
    case "stage": return (m) => m.comp === target.comp && m.stage === target.stage;
    case "round": return (m) => m.comp === target.comp && m.stage === target.stage && m.round === target.round;
    case "ids": { const ids = new Set(target.ids); return (m) => ids.has(m.id); }
    case "phase": {
      if (frontier.some((m) => m.stage === "LG")) return (m) => m.stage === "LG";
      if (frontier.some((m) => !GALA.has(m.comp))) return (m) => !GALA.has(m.comp);
      return () => true;
    }
  }
}

export async function playSeason(db: Db, target: PlayTarget, onProgress: (p: PlayProgress) => void) {
  pauseRequested = false;
  const input = await seasonInput(db);
  let saved: SimMatch[] = await listSeasonMatches(db, input.seasonId);
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
