// Game order stored as a small number: bit i = 1 when side A won game i+1 (max 7 games).
// The number of games comes from scoreA + scoreB.
export function gamesToMask(games: ("A" | "B")[]): number {
  return games.reduce((mask, g, i) => (g === "A" ? mask | (1 << i) : mask), 0);
}

export function gamesFromMask(mask: number, count: number): ("A" | "B")[] {
  return Array.from({ length: count }, (_, i) => ((mask >> i) & 1 ? "A" : "B"));
}
