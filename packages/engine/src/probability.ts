// Chance that A wins one game (PRD §5.1): logistic Elo-style curve on the 0–100 scale.
export function gameWinProbability(effectiveA: number, effectiveB: number, scale = 40): number {
  return 1 / (1 + 10 ** (-(effectiveA - effectiveB) / scale));
}
