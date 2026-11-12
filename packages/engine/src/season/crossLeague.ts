// "Best" across leagues (PRD §4): league points, then game diff, then games won, then rating.
import type { StandingRow } from "../standings";

export type RankedIdol = { row: StandingRow; rating: number };

export const crossLeague = (x: RankedIdol, y: RankedIdol) =>
  y.row.points - x.row.points || y.row.gameDiff - x.row.gameDiff || y.row.gamesWon - x.row.gamesWon
  || y.rating - x.rating || (x.row.idolId < y.row.idolId ? -1 : 1);

// Deals a ranked list into groups snake-style: 1-2-3-4-4-3-2-1-... (user decision for Swiss/LCQ).
export function snake<T>(ranked: T[], groupCount: number): T[][] {
  const groups: T[][] = Array.from({ length: groupCount }, () => []);
  ranked.forEach((item, i) => {
    const lap = Math.floor(i / groupCount);
    const pos = i % groupCount;
    groups[lap % 2 === 0 ? pos : groupCount - 1 - pos].push(item);
  });
  return groups;
}
