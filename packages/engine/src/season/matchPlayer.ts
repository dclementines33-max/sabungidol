// Plays one match inside a season: builds the id, picks Best of N, applies form and morale, records it.
// Replay (Fase 3): a saved result with the same pairing is reused as it was; a match that may not be
// played yet (input.target) is pending — in the league phase it is skipped (fixtures do not depend
// on results), in a cup it stops that cup (PENDING), because the next round needs the result.
import { type CompetitionCode, type StageCode, buildMatchId, seasonBestOf } from "@sabung/shared";
import { type Result, getForm } from "../form";
import { moraleAfter, moraleModifier } from "../morale";
import { matchRng } from "../rng";
import { simulateSeries } from "../series";
import { type MatchRef, PENDING, type SeasonInput, type SimMatch } from "./types";

const BIG_CUPS = new Set(["SWS", "LCQ", "UZC", "INK", "IDL"]);

export type MatchPlayer = ReturnType<typeof createMatchPlayer>;

export function createMatchPlayer(input: SeasonInput) {
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const recent = new Map<string, Result[]>(); // results across all competitions, oldest first
  const morale = new Map<string, number>(); // 2026-11-17: builds over the season (morale.ts)
  const saved = new Map((input.saved ?? []).map((m) => [m.id, m]));
  const matches: SimMatch[] = [];
  const pending: MatchRef[] = [];
  const stale: string[] = [];
  let inLeaguePhase = true;
  const cupLoad = new Map<string, number>(); // big-cup matches each idol played this season (fatigue, Update 3)

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
      // Update 3: Nugu and B-Side are the upset cups. An idol worn out by the big cups (Swiss, LCQ, Unzure, Inkigayo,
      // The Idols playoff) loses 0.75 per such match (at most 6); rating gaps count less (scale ×1.4) and the day-to-day swing is 1.5× larger. Same rule for both sides.
      const chaos = comp === "NUG" || comp.startsWith("BS");
      const tired = (idol: string) => (chaos ? Math.min(6, 0.75 * (cupLoad.get(idol) ?? 0)) : 0);
      const series = simulateSeries({
        ratingA, ratingB, formA: formA.modifier + moraleModifier(morale.get(idolA) ?? 0) - tired(idolA), formB: formB.modifier + moraleModifier(morale.get(idolB) ?? 0) - tired(idolB),
        bestOf: seasonBestOf(input.config, comp, stage, round), rng: matchRng(input.seed, id, input.salt?.[id]),
        tuning: chaos ? { scale: 1.4 * (input.tuning?.scale ?? 40), sigma: 1.5 * (input.tuning?.sigma ?? 4) } : input.tuning,
      });
      match = { id, comp, stage, round, slot, idolA, idolB, ...series, ratingA, ratingB, formA: formA.name, formB: formB.name };
    }
    matches.push(match);
    if (BIG_CUPS.has(comp) && stage !== "LG") for (const idol of [idolA, idolB]) cupLoad.set(idol, (cupLoad.get(idol) ?? 0) + 1);
    const outcome = (side: "A" | "B"): Result => (match.result === "D" ? "D" : match.result === side ? "W" : "L");
    recent.set(idolA, [...(recent.get(idolA) ?? []), outcome("A")].slice(-5));
    recent.set(idolB, [...(recent.get(idolB) ?? []), outcome("B")].slice(-5));
    morale.set(idolA, moraleAfter(morale.get(idolA) ?? 0, match, "A"));
    morale.set(idolB, moraleAfter(morale.get(idolB) ?? 0, match, "B"));
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
