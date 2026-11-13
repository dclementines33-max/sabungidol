// Plays one match inside a season: builds the id, picks Best of N, applies form, records it.
// Replay (Fase 3): a saved result with the same pairing is reused as it was; a match that may not be
// played yet (input.target) is pending — in the league phase it is skipped (fixtures do not depend
// on results), in a cup it stops that cup (PENDING), because the next round needs the result.
import { type CompetitionCode, type StageCode, buildMatchId, seasonBestOf } from "@sabung/shared";
import { type Result, getForm } from "../form";
import { matchRng } from "../rng";
import { simulateSeries } from "../series";
import { type MatchRef, PENDING, type SeasonInput, type SimMatch } from "./types";

export type MatchPlayer = ReturnType<typeof createMatchPlayer>;

export function createMatchPlayer(input: SeasonInput) {
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const recent = new Map<string, Result[]>(); // results across all competitions, oldest first
  const saved = new Map((input.saved ?? []).map((m) => [m.id, m]));
  const matches: SimMatch[] = [];
  const pending: MatchRef[] = [];
  const stale: string[] = [];
  let inLeaguePhase = true;

  const play = (comp: CompetitionCode, stage: StageCode, round: string, slot: number, idolA: string, idolB: string): SimMatch | null => {
    const id = buildMatchId({ season: input.season, comp, stage, round, slot });
    const formA = getForm(recent.get(idolA) ?? []);
    const formB = getForm(recent.get(idolB) ?? []);
    const old = saved.get(id);
    let match: SimMatch;
    if (old && old.idolA === idolA && old.idolB === idolB) match = old;
    else {
      if (old) stale.push(id); // an earlier result changed who plays here
      const ref: MatchRef = { id, comp, stage, round, idolA, idolB };
      if (input.target && !input.target(ref)) {
        pending.push(ref);
        if (inLeaguePhase) return null;
        throw PENDING;
      }
      const ratingA = rating.get(idolA)!;
      const ratingB = rating.get(idolB)!;
      const series = simulateSeries({
        ratingA, ratingB, formA: formA.modifier, formB: formB.modifier,
        bestOf: seasonBestOf(input.config, comp, stage, round), rng: matchRng(input.seed, id), tuning: input.tuning,
      });
      match = { id, comp, stage, round, slot, idolA, idolB, ...series, ratingA, ratingB, formA: formA.name, formB: formB.name };
    }
    matches.push(match);
    const outcome = (side: "A" | "B"): Result => (match.result === "D" ? "D" : match.result === side ? "W" : "L");
    recent.set(idolA, [...(recent.get(idolA) ?? []), outcome("A")].slice(-5));
    recent.set(idolB, [...(recent.get(idolB) ?? []), outcome("B")].slice(-5));
    return match;
  };

  // Knockout formats are never Bo4, so a winner always exists.
  const playKo = (comp: CompetitionCode, stage: StageCode, round: string, slot: number, a: string, b: string): "A" | "B" => {
    const { result } = play(comp, stage, round, slot, a, b)!; // outside the league phase play() never returns null
    if (result === "D") throw new Error(`Knockout match ${comp} ${round} ended in a draw`);
    return result;
  };

  // What the cups drew, for the panels: Swiss groups, LCQ groups, the 4 Unzure pots, the 16 Unzure groups.
  const draws: Partial<Record<"swiss" | "lcq" | "pots" | "groups", string[][]>> = {};
  const entrants: Record<string, string[]> = {}; // each bracket cup's seeds, best first (panels show them before they play)
  return { play, playKo, matches, pending, stale, draws, entrants, endLeaguePhase: () => { inLeaguePhase = false; }, rating: (id: string) => rating.get(id)! };
}
