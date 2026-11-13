// One match through the MatchModal (Fase 3 step 6, PRD §9): what the engine would play for it, and
// writing the result the user accepted (simulated, clicked game by game, or spun). The replay then
// reuses that saved result and every later match follows from it.
import { type Db, saveMatches } from "@sabung/db";
import { type Side, runSeason, seriesState } from "@sabung/engine";
import { seasonBestOf } from "@sabung/shared";
import { seasonInput } from "./seasonRunner";
import { seasonMatches } from "./seasonMatches";

async function playable(db: Db, id: string, salt = 0) {
  const input = await seasonInput(db);
  const saved = await seasonMatches(db, input.seasonId);
  if (saved.some((m) => m.id === id)) throw new Error(`Match ${id} sudah dimainkan.`);
  const match = runSeason({ ...input, saved, target: (m) => m.id === id, salt: { [id]: salt } }).matches.find((m) => m.id === id);
  if (!match) throw new Error(`Match ${id} belum bisa dimainkan.`);
  return { seasonId: input.seasonId, match, saved, bestOf: seasonBestOf(input.config, match.comp, match.stage, match.round) };
}

// Nothing is saved: the modal shows these idols (its "Simulate" asks simulateMatch for fresh games).
// Also each idol's record this season (W-D-L), in this competition and in all of them, for the facts table.
export async function matchPreview(db: Db, id: string) {
  const { match, saved, bestOf } = await playable(db, id);
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
  };
}

// "Simulate" in the MatchModal (Update 3): played the moment it is pressed, with a new salt each time, so
// pressing it again can give another result (the bulk "Main …" buttons stay on the season seed).
export const simulateMatch = async (db: Db, id: string, salt: number) => (await playable(db, id, salt)).match.games;

export async function acceptMatch(db: Db, id: string, games: Side[], method: "sim" | "manual" | "wheel") {
  const { seasonId, match, bestOf } = await playable(db, id);
  const state = seriesState(bestOf, games);
  // The series must end exactly on the last game, with only A/B games.
  if (!state.result || seriesState(bestOf, games.slice(0, -1)).result || games.some((g) => g !== "A" && g !== "B")) {
    throw new Error(`Hasil game tidak sah untuk Bo${bestOf}.`);
  }
  await saveMatches(db, seasonId, [{ ...match, games, scoreA: state.scoreA, scoreB: state.scoreB, result: state.result }], method);
  return { scoreA: state.scoreA, scoreB: state.scoreB, result: state.result };
}
