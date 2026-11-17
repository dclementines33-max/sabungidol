// A match. Two marbles: a Best-of-N series with the app's rules (engine seriesRules: Bo3/5/7 first to 2/3/4, Bo4 first
// to 3 or 2–2 = draw); the result is the games' winners in order ("A" = marble 0, "B" = marble 1), what the app's
// acceptMatch takes. Three to twenty marbles: a Grand Prix of N races with F1 points (25-18-15-12-10-8-6-4-2-1), ties
// broken by wins. Every game is on a different arena, drawn at random for the match.
import * as THREE from "three";
import { drawArenas } from "./arenas/index.js";
import { createGame, rng } from "./race.js";
import { freeGroup } from "./scene.js";

export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const seriesTarget = (bestOf) => (bestOf === 4 ? 3 : (bestOf + 1) / 2);

export function createMatch({ bestOf, ratings, advantage, seed }) {
  return { bestOf, ratings, advantage, seed, gp: ratings.length > 2, arenas: drawArenas(rng(seed)), results: [], gameSeed: (g) => (seed * 31 + g * 7919) | 0 };
}

export const games = (match) => match.results.map((r) => (r[0] === 0 ? "A" : "B"));

// Where the match stands. Duel: { a, b, result: "A" | "B" | "D" | null }. Grand Prix: points and wins per marble, the
// table (best first) and whether all races are run.
export function standing(match) {
  if (!match.gp) {
    const g = games(match), target = seriesTarget(match.bestOf);
    const a = g.filter((x) => x === "A").length, b = g.length - a;
    return { a, b, result: a >= target ? "A" : b >= target ? "B" : g.length === match.bestOf ? "D" : null };
  }
  const points = match.ratings.map(() => 0), wins = match.ratings.map(() => 0);
  for (const r of match.results) { r.forEach((k, place) => { points[k] += POINTS[place] ?? 0; }); wins[r[0]]++; }
  const table = points.map((p, k) => k).sort((x, y) => points[y] - points[x] || wins[y] - wins[x] || x - y);
  return { points, wins, table, result: match.results.length >= match.bestOf ? table[0] : null };
}

export const isOver = (match) => standing(match).result !== null;

// Plays one game of the match without drawing (Skip) and returns its finishing order.
export function playHeadless(RAPIER, match, g) {
  const group = new THREE.Group();
  const game = createGame({ RAPIER, arena: match.arenas[g], ratings: match.ratings, advantage: match.advantage, seed: match.gameSeed(g), group });
  game.finish();
  const order = [...game.state.results];
  game.dispose(); freeGroup(group);
  return order;
}
