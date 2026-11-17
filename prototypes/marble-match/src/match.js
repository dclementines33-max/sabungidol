// A match = a Best-of-N series of games, the same rules as the app (engine seriesRules): Bo3/5/7 first to 2/3/4, Bo4
// first to 3 or 2–2 = draw. Each game is on a different arena, drawn at random for the match. The result handed back is
// the games' winners in order ("A" = red corner, "B" = blue) — exactly what the app's acceptMatch takes.
import * as THREE from "three";
import { drawArenas } from "./arenas/index.js";
import { createGame, rng } from "./race.js";
import { freeGroup } from "./scene.js";

export const seriesTarget = (bestOf) => (bestOf === 4 ? 3 : (bestOf + 1) / 2);

export function seriesState(bestOf, games) {
  const target = seriesTarget(bestOf);
  const a = games.filter((g) => g === "A").length, b = games.length - a;
  return { a, b, result: a >= target ? "A" : b >= target ? "B" : games.length === bestOf ? "D" : null };
}

export function createMatch({ bestOf, ratings, advantage, seed }) {
  const rand = rng(seed);
  return { bestOf, ratings, advantage, seed, arenas: drawArenas(rand), games: [], gameSeed: (g) => (seed * 31 + g * 7919) | 0 };
}

// Plays one game of the match without drawing (Skip) and returns its winner side.
export function playHeadless(RAPIER, match, g) {
  const group = new THREE.Group();
  const game = createGame({ RAPIER, arena: match.arenas[g], ratings: match.ratings, advantage: match.advantage, seed: match.gameSeed(g), group });
  game.finish();
  const side = game.state.winner === 0 ? "A" : "B";
  game.dispose(); freeGroup(group);
  return side;
}
