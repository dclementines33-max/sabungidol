// A bracket is a list of matches whose sides come from a seed or from an earlier match.
// Templates are plain data; runBracket plays them in order.
import type { StageCode } from "@sabung/shared";

export type Source = { seed: number } | { winner: string } | { loser: string };
export type BracketMatch = { key: string; stage: StageCode; round: string; slot: number; a: Source; b: Source };
export type BracketResult = Omit<BracketMatch, "a" | "b"> & { a: string; b: string; winner: string; loser: string };

type Play = (match: BracketMatch, a: string, b: string) => "A" | "B";

// entrants[0] is seed 1. play() returns which side won.
export function runBracket(template: BracketMatch[], entrants: string[], play: Play): BracketResult[] {
  const rounds = bracketRounds(template, entrants, play);
  for (let step = rounds.next(); ; step = rounds.next()) if (step.done) return step.value;
}

// Same, but pauses after each round so a season can interleave several cups.
export function* bracketRounds(template: BracketMatch[], entrants: string[], play: Play): Generator<void, BracketResult[]> {
  const done = new Map<string, BracketResult>();
  const resolve = (s: Source): string => {
    if ("seed" in s) {
      const id = entrants[s.seed - 1];
      if (!id) throw new Error(`Bracket has no entrant for seed ${s.seed}`);
      return id;
    }
    const key = "winner" in s ? s.winner : s.loser;
    const earlier = done.get(key);
    if (!earlier) throw new Error(`Bracket match ${key} is used before it is played`);
    return "winner" in s ? earlier.winner : earlier.loser;
  };
  for (const [i, match] of template.entries()) {
    const previous = template[i - 1];
    if (previous && (previous.stage !== match.stage || previous.round !== match.round)) yield;
    const a = resolve(match.a);
    const b = resolve(match.b);
    const aWon = play(match, a, b) === "A";
    done.set(match.key, { ...match, a, b, winner: aWon ? a : b, loser: aWon ? b : a });
  }
  return [...done.values()];
}
