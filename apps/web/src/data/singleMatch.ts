// One match through the MatchModal (Fase 3 step 6, PRD §9): what the engine would play for it, and
// writing the result the user accepted (simulated, clicked game by game, or spun). The replay then
// reuses that saved result and every later match follows from it.
import { type Db, saveMatches } from "@sabung/db";
import { type Side, moraleName, moraleTrack, runSeason, seriesState } from "@sabung/engine";
import { ARENA_IDS, seasonBestOf } from "@sabung/shared";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

async function playable(db: Db, id: string, salt = 0) {
  const input = await seasonInput(db);
  const saved = await seasonMatches(db, input.seasonId);
  if (saved.some((m) => m.id === id)) throw new Error(`Match ${id} has already been played.`);
  const played = runSeason({ ...input, saved, target: (m) => m.id === id, salt: { [id]: salt } }).matches;
  const at = played.findIndex((m) => m.id === id);
  const match = played[at];
  if (!match) throw new Error(`Match ${id} can't be played yet.`);
  return { seasonId: input.seasonId, match, before: played.slice(0, at), saved, bestOf: seasonBestOf(input.config, match.comp, match.stage, match.round) };
}

// Nothing is saved: the modal shows these idols.
// Also each idol's record this season (W-D-L), in this competition and in all of them, for the facts table.
export async function matchPreview(db: Db, id: string) {
  const { match, before, saved, bestOf } = await playable(db, id);
  const morale = moraleTrack(before); // going into this match
  const mood = (idol: string) => { const v = morale.get(idol) ?? 0; return `${moraleName(v)} (${v > 0 ? "+" : ""}${v.toFixed(1)})`; };
  const record = (idol: string, comp?: string) => {
    const r = { w: 0, d: 0, l: 0 };
    for (const m of saved) {
      if ((m.idolA !== idol && m.idolB !== idol) || (comp && m.comp !== comp)) continue;
      if (m.result === "D") r.d++;
      else if ((m.result === "A") === (m.idolA === idol)) r.w++;
      else r.l++;
    }
    return `${r.w}-${r.d}-${r.l}`;
  };
  return {
    id, comp: match.comp, stage: match.stage, round: match.round, slot: match.slot, idolA: match.idolA, idolB: match.idolB, bestOf,
    record: { comp: [record(match.idolA, match.comp), record(match.idolB, match.comp)], all: [record(match.idolA), record(match.idolB)] },
    form: [match.formA, match.formB], morale: [mood(match.idolA), mood(match.idolB)],
  };
}


// `arenas` = what the match dialog drew (one, or one per game for a grand final; extra ones beyond the games are cut).
export async function acceptMatch(db: Db, id: string, games: Side[], method: "sim" | "manual" | "wheel" | "marble", arenas: string[] = []) {
  const { seasonId, match, bestOf } = await playable(db, id);
  const state = seriesState(bestOf, games);
  // The series must end exactly on the last game, with only A/B games.
  if (!state.result || seriesState(bestOf, games.slice(0, -1)).result || games.some((g) => g !== "A" && g !== "B")) {
    throw new Error(`Those games aren't a valid Bo${bestOf} result.`);
  }
  if (arenas.some((a) => !ARENA_IDS.has(a))) throw new Error("Unknown arena.");
  const played = arenas.length > 1 ? arenas.slice(0, games.length) : arenas;
  await saveMatches(db, seasonId, [{ ...match, games, scoreA: state.scoreA, scoreB: state.scoreB, result: state.result, arenas: played.length ? played : null }], method);
  return { scoreA: state.scoreA, scoreB: state.scoreB, result: state.result };
}
