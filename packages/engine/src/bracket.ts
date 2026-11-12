// A bracket is a list of matches whose sides come from a seed or from an earlier match.
// Templates are plain data; runBracket plays them in order.
import type { StageCode } from "@sabung/shared";

export type Source = { seed: number } | { winner: string } | { loser: string };
export type BracketMatch = { key: string; stage: StageCode; round: string; slot: number; a: Source; b: Source };
export type BracketResult = Omit<BracketMatch, "a" | "b"> & { a: string; b: string; winner: string; loser: string };

type Play = (match: BracketMatch, a: string, b: string) => "A" | "B";

// A match as the screen shows it: sides known so far (undefined = still to be decided).
export type BracketCell = Omit<BracketMatch, "a" | "b"> & { a?: string; b?: string; winner?: string; score?: string };

// Fills a template with what is known: entrants, and the played matches (by key).
export function resolveBracket(template: BracketMatch[], entrants: string[], played: Map<string, { winner: string; score?: string }>): BracketCell[] {
  const cells = new Map<string, BracketCell>();
  const who = (s: Source): string | undefined => {
    if ("seed" in s) return entrants[s.seed - 1];
    const earlier = cells.get("winner" in s ? s.winner : s.loser);
    if (!earlier?.winner) return undefined;
    return "winner" in s ? earlier.winner : earlier.winner === earlier.a ? earlier.b : earlier.a;
  };
  for (const match of template) {
    const result = played.get(match.key);
    cells.set(match.key, { ...match, a: who(match.a), b: who(match.b), winner: result?.winner, score: result?.score });
  }
  return [...cells.values()];
}

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
