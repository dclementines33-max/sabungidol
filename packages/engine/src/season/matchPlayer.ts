// Plays one match inside a season: builds the id, picks Best of N, applies form, records it.
import { type CompetitionCode, type StageCode, buildMatchId, defaultBestOf } from "@sabung/shared";
import { type Result, getForm } from "../form";
import { matchRng } from "../rng";
import { simulateSeries } from "../series";
import type { SeasonInput, SimMatch } from "./types";

export type MatchPlayer = ReturnType<typeof createMatchPlayer>;

export function createMatchPlayer(input: SeasonInput) {
  const rating = new Map(input.idols.map((i) => [i.id, i.rating]));
  const recent = new Map<string, Result[]>(); // results across all competitions, oldest first
  const matches: SimMatch[] = [];

  const play = (comp: CompetitionCode, stage: StageCode, round: string, slot: number, idolA: string, idolB: string): SimMatch => {
    const id = buildMatchId({ season: input.season, comp, stage, round, slot });
    const formA = getForm(recent.get(idolA) ?? []);
    const formB = getForm(recent.get(idolB) ?? []);
    const ratingA = rating.get(idolA)!;
    const ratingB = rating.get(idolB)!;
    const series = simulateSeries({
      ratingA, ratingB, formA: formA.modifier, formB: formB.modifier,
      bestOf: defaultBestOf(comp, stage, round), rng: matchRng(input.seed, id), tuning: input.tuning,
    });
    const match: SimMatch = { id, comp, stage, round, slot, idolA, idolB, ...series, ratingA, ratingB, formA: formA.name, formB: formB.name };
    matches.push(match);
    const outcome = (side: "A" | "B"): Result => (series.result === "D" ? "D" : series.result === side ? "W" : "L");
    recent.set(idolA, [...(recent.get(idolA) ?? []), outcome("A")].slice(-5));
    recent.set(idolB, [...(recent.get(idolB) ?? []), outcome("B")].slice(-5));
    return match;
  };

  // Knockout formats are never Bo4, so a winner always exists.
  const playKo = (comp: CompetitionCode, stage: StageCode, round: string, slot: number, a: string, b: string): "A" | "B" => {
    const { result } = play(comp, stage, round, slot, a, b);
    if (result === "D") throw new Error(`Knockout match ${comp} ${round} ended in a draw`);
    return result;
  };

  return { play, playKo, matches, rating: (id: string) => rating.get(id)! };
}
