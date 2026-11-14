// "Sync from career stats" targets (§6.5; changed 2026-11-15: the old rank → even 45–98 spread put ~15% at 90+).
// Still ranked by career score, but the rank maps onto a curve shaped like a healthy league: the bottom tenth in the
// 50s–low 60s, the middle around 76, the top tenth from 85, and only the top ~2–3% at 90+ (piecewise linear).
const CURVE: [number, number][] = [[0, 55], [0.1, 64], [0.5, 76], [0.9, 85], [0.97, 89], [0.99, 93], [1, 96]];

export function percentileRating(p: number): number {
  const i = CURVE.findIndex(([q]) => q >= p);
  if (i <= 0) return CURVE[0]![1];
  const [q0, r0] = CURVE[i - 1]!, [q1, r1] = CURVE[i]!;
  return r0 + ((p - q0) / (q1 - q0)) * (r1 - r0);
}

export function careerTargets(totals: Map<string, number>): Map<string, number> {
  const ranked = [...totals].sort((a, b) => a[1] - b[1]);
  return new Map(ranked.map(([id], i) => [id, percentileRating(ranked.length > 1 ? i / (ranked.length - 1) : 1)]));
}

// The old mapping, kept only to compare in the test.
export function rankTargets(totals: Map<string, number>): Map<string, number> {
  const ranked = [...totals].sort((a, b) => a[1] - b[1]);
  return new Map(ranked.map(([id], i) => [id, 45 + (ranked.length > 1 ? i / (ranked.length - 1) : 1) * (98 - 45)]));
}
