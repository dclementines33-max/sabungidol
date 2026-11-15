// A bracket is a list of matches whose sides come from a seed or from an earlier match.
// Templates are plain data; runBracket plays them in order.
import type { StageCode } from "@sabung/shared";
import { PENDING, pendingBatch } from "./season/types";

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

// The order to draw a bracket in (2026-11-16 bug: seed pairing re-pairs best v worst each round, so match 2's winner
// does not play in the next round's match 1; drawn in slot order, winners appeared in the wrong box). Rounds are
// walked from the last one back: each round lists first the matches whose winners feed the (already ordered) later
// rounds, in that order, then the rest. So the two cards drawn next to each other always feed the card they join.
export function bracketDisplayOrder(template: BracketMatch[]): string[] {
  const rounds: BracketMatch[][] = [];
  for (const m of template) {
    const last = rounds.at(-1);
    if (last && last[0]!.stage === m.stage && last[0]!.round === m.round) last.push(m); else rounds.push([m]);
  }
  const ordered: BracketMatch[][] = [];
  for (let i = rounds.length - 1; i >= 0; i--) {
    const mine = new Map(rounds[i]!.map((m) => [m.key, m]));
    const fed: BracketMatch[] = [];
    for (const later of ordered) for (const m of later) for (const s of [m.a, m.b]) { // nearest later round first
      const feeder = "winner" in s ? mine.get(s.winner) : undefined;
      if (feeder && !fed.includes(feeder)) fed.push(feeder);
    }
    ordered.unshift([...fed, ...rounds[i]!.filter((m) => !fed.includes(m))]);
  }
  return ordered.flat().map((m) => m.key);
}

// entrants[0] is seed 1. play() returns which side won.
export function runBracket(template: BracketMatch[], entrants: string[], play: Play): BracketResult[] {
  const rounds = bracketRounds(template, entrants, play);
  for (let step = rounds.next(); ; step = rounds.next()) if (step.done) return step.value;
}

// Same, but pauses after each round so a season can interleave several cups.
export function* bracketRounds(template: BracketMatch[], entrants: string[], play: Play): Generator<void, BracketResult[]> {
  const done = new Map<string, BracketResult>();
  const waiting = new Set<string>();
  const resolve = (s: Source): string => {
    if ("seed" in s) {
      const id = entrants[s.seed - 1];
      if (!id) throw new Error(`Bracket has no entrant for seed ${s.seed}`);
      return id;
    }
    const key = "winner" in s ? s.winner : s.loser;
    const earlier = done.get(key);
    if (!earlier && waiting.has(key)) throw PENDING; // same round, waits for a match still pending
    if (!earlier) throw new Error(`Bracket match ${key} is used before it is played`);
    return "winner" in s ? earlier.winner : earlier.loser;
  };
  let batch = pendingBatch(); // one round: every match that can be reached is played or listed pending
  for (const [i, match] of template.entries()) {
    const previous = template[i - 1];
    if (previous && (previous.stage !== match.stage || previous.round !== match.round)) { batch.done(); yield; batch = pendingBatch(); }
    const played = batch.run(() => {
      const a = resolve(match.a);
      const b = resolve(match.b);
      return { a, b, aWon: play(match, a, b) === "A" };
    });
    if (!played) { waiting.add(match.key); continue; }
    const { a, b, aWon } = played;
    done.set(match.key, { ...match, a, b, winner: aWon ? a : b, loser: aWon ? b : a });
  }
  batch.done();
  return [...done.values()];
}
