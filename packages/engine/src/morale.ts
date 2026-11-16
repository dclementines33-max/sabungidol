// Morale (2026-11-17, user via router): how an idol feels about her season, next to form (the last 5 results). It builds
// over the whole season and fades: after every match morale × FADE + what the match meant — a win or loss, an upset
// either way, a sweep, a final. It starts at 0 each season, stays within ±MORALE_MAX, and is worth at most ±MAX_EFFECT
// rating points in a match (form adds its own −2…+3). Pure: the same results always give the same morale.
import type { SimMatch } from "./season/types";

export const MORALE_MAX = 10;
export const MAX_EFFECT = 2; // rating points at ±MORALE_MAX
const FADE = 0.85; // a run of wins settles near 1 / (1 − FADE) ≈ 6.7, a big final or upset on top of that pushes higher
const UPSET = 8; // rating gap that makes a result an upset
const FINALS = new Set(["F", "GF"]);

export type MoraleName = "Euphoric" | "Buoyant" | "Settled" | "Shaken" | "Crushed";

const clamp = (m: number) => Math.max(-MORALE_MAX, Math.min(MORALE_MAX, m));

// Morale after one match, for the idol on side A or B.
export function moraleAfter(morale: number, m: SimMatch, side: "A" | "B"): number {
  const [own, opp, mine, theirs] = side === "A" ? [m.ratingA, m.ratingB, m.scoreA, m.scoreB] : [m.ratingB, m.ratingA, m.scoreB, m.scoreA];
  const outcome = m.result === "D" ? 0 : m.result === side ? 1 : -1;
  let delta = outcome;
  if (outcome === 1 && opp - own >= UPSET) delta += 2; // beat a much stronger idol
  if (outcome === -1 && own - opp >= UPSET) delta -= 2; // lost to a much weaker one
  if (outcome !== 0 && Math.min(mine, theirs) === 0 && Math.max(mine, theirs) >= 2) delta += outcome; // a sweep, either way
  if (outcome !== 0 && (FINALS.has(m.round) || m.stage === "FN")) delta += outcome === 1 ? 3 : -2; // finals weigh most
  return clamp(morale * FADE + delta);
}

// The rating points morale is worth in a match: bounded by MAX_EFFECT.
export const moraleModifier = (morale: number) => (clamp(morale) / MORALE_MAX) * MAX_EFFECT;

export function moraleName(morale: number): MoraleName {
  if (morale >= 6) return "Euphoric";
  if (morale >= 2) return "Buoyant";
  if (morale > -2) return "Settled";
  if (morale > -6) return "Shaken";
  return "Crushed";
}

// Every idol's morale after these matches (in play order).
export function moraleTrack(matches: SimMatch[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of matches) {
    out.set(m.idolA, moraleAfter(out.get(m.idolA) ?? 0, m, "A"));
    out.set(m.idolB, moraleAfter(out.get(m.idolB) ?? 0, m, "B"));
  }
  return out;
}
