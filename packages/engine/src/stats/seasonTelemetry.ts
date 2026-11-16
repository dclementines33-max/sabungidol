// Season telemetry (2026-11-17, user via router): every idol's results against what her rating expected. Measured per
// game, so series length can't flatter favourites: actual = share of games won, expected = the mean chance of winning a
// game from both ratings (the same curve the simulator plays with), weighted by the games each match had. Pure.
import { gameWinProbability } from "../probability";
import type { SimMatch } from "../season/types";

export type Telemetry = { idolId: string; rating: number; games: number; actual: number; expected: number; delta: number };

export const MIN_GAMES = 10; // fewer games say nothing

export function seasonTelemetry(matches: SimMatch[], scale = 40): Telemetry[] {
  const acc = new Map<string, { rating: number; games: number; won: number; expected: number }>();
  for (const m of matches) {
    const games = m.scoreA + m.scoreB;
    if (!games) continue;
    const p = gameWinProbability(m.ratingA, m.ratingB, scale);
    for (const [id, rating, won, chance] of [[m.idolA, m.ratingA, m.scoreA, p], [m.idolB, m.ratingB, m.scoreB, 1 - p]] as const) {
      const a = acc.get(id) ?? { rating, games: 0, won: 0, expected: 0 }; // rating = pre-season (first match)
      acc.set(id, { rating: a.rating, games: a.games + games, won: a.won + won, expected: a.expected + chance * games });
    }
  }
  return [...acc].filter(([, a]) => a.games >= MIN_GAMES).map(([idolId, a]) => {
    const actual = a.won / a.games;
    const expected = a.expected / a.games;
    return { idolId, rating: a.rating, games: a.games, actual, expected, delta: actual - expected };
  }).sort((x, y) => y.delta - x.delta || x.idolId.localeCompare(y.idolId));
}
