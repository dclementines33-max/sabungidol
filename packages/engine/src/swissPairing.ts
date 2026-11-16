// Pairs the next Swiss round (PRD §5.6). An idol is out at 3 wins or 3 losses.
// Round 1 = pot order (seed 1 v last). Later rounds: equal records, random, never a rematch.
// Only if that is impossible: nearest record, with fallback = true so the user can be told.
import type { Rng } from "./rng";
import { shuffle } from "./shuffle";

export type SwissMatch = { a: string; b: string; winner: string; score?: string };
export type Pair = [string, string];
export type SwissRecord = { wins: number; losses: number };

export function swissRecords(idolIds: string[], history: SwissMatch[]): Map<string, SwissRecord> {
  const records = new Map(idolIds.map((id) => [id, { wins: 0, losses: 0 }]));
  for (const m of history) {
    records.get(m.winner)!.wins++;
    records.get(m.winner === m.a ? m.b : m.a)!.losses++;
  }
  return records;
}

// Backtracking: pair the first idol with the first allowed candidate that lets the rest work out.
function solve(list: string[], allowed: (x: string, y: string) => boolean, order: (x: string, rest: string[]) => string[]): Pair[] | null {
  if (list.length === 0) return [];
  const [first, ...rest] = list;
  for (const other of order(first, rest)) {
    if (!allowed(first, other)) continue;
    const sub = solve(rest.filter((id) => id !== other), allowed, order);
    if (sub) return [[first, other], ...sub];
  }
  return null;
}

export function swissPairings(seededIds: string[], history: SwissMatch[], rng: Rng, target = 3): { pairs: Pair[]; fallback: boolean } {
  if (history.length === 0) {
    const n = seededIds.length;
    return { pairs: seededIds.slice(0, n / 2).map((id, i): Pair => [id, seededIds[n - 1 - i]]), fallback: false };
  }
  const records = swissRecords(seededIds, history);
  const met = new Set(history.flatMap((m) => [`${m.a}|${m.b}`, `${m.b}|${m.a}`]));
  const allowed = (x: string, y: string) => !met.has(`${x}|${y}`);
  const rec = (id: string) => records.get(id)!;
  // Best record first (more wins, then fewer losses); random order inside a record.
  const active = shuffle(seededIds.filter((id) => rec(id).wins < target && rec(id).losses < target), rng)
    .sort((x, y) => rec(y).wins - rec(x).wins || rec(x).losses - rec(y).losses);

  const buckets = new Map<string, string[]>();
  for (const id of active) {
    const key = `${rec(id).wins}-${rec(id).losses}`;
    buckets.set(key, [...(buckets.get(key) ?? []), id]);
  }
  const keepOrder = (_: string, rest: string[]) => rest;
  const perBucket = [...buckets.values()].map((ids) => solve(ids, allowed, keepOrder));
  if (perBucket.every((p) => p !== null)) return { pairs: perBucket.flat() as Pair[], fallback: false };

  const distance = (x: string, y: string) => Math.abs(rec(x).wins - rec(y).wins) + Math.abs(rec(x).losses - rec(y).losses);
  const nearestFirst = (x: string, rest: string[]) => [...rest].sort((p, q) => distance(x, p) - distance(x, q));
  const pairs = solve(active, allowed, nearestFirst);
  if (!pairs) throw new Error("Swiss pairing impossible without a rematch");
  return { pairs, fallback: true };
}
