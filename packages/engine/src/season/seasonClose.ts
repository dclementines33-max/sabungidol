// Closing a season (PRD §4 "Penutupan", §6.1–6.3): achievement points per competition, Season
// Progression of ratings, and promotion/relegation (D1 18–20 ↔ D2 1–3 of the paired league).
// Choices made with the user (2026-11-13): knockout points by the round an idol went out in, a tie
// shares the average of its places (two SF losers without a 3rd-place match = 50); draws count half.
import { D1_LEAGUES, D2_LEAGUES } from "@sabung/shared";
import { computeStandings } from "../standings";
import { type Part, PRESTIGE, expectationParts, placeValue, prestigeOf } from "./expectation";
import { seasonPlacements } from "./placements";
import type { SimMatch, Title } from "./types";

export { PRESTIGE };

type Points = Map<string, number>; // idol → Σ points × prestige
const add = (points: Points, idol: string, value: number) => points.set(idol, (points.get(idol) ?? 0) + value);

// Points from the season's places (§6.2): leagues 100 × (21 − rank) / 20; brackets by place, a tie
// sharing the average of its places; Unzure: at least 12 through the group, 5 out in the group.
export function seasonPoints(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>, rating: (id: string) => number): Points {
  const points: Points = new Map();
  for (const p of seasonPlacements(matches, titles, leagues, rating)) {
    add(points, p.idolId, placeValue(p) * prestigeOf(p.comp));
  }
  return points;
}

export type PromotionPlan = { leagues: Record<string, string[]>; promoted: string[]; relegated: string[] };

export function promotionPlan(matches: SimMatch[], leagues: Record<string, string[]>, rating: (id: string) => number): PromotionPlan {
  const ranked = (comp: string) => computeStandings((leagues[comp] ?? []).map((id) => ({ id, startRating: rating(id) })), matches.filter((m) => m.comp === comp && m.stage === "LG")).map((r) => r.idolId);
  const next: Record<string, string[]> = {};
  const promoted: string[] = [];
  const relegated: string[] = [];
  D1_LEAGUES.forEach((d1, i) => {
    const d2 = D2_LEAGUES[i]!;
    const top = ranked(d1);
    const bottom = ranked(d2);
    relegated.push(...top.slice(17));
    promoted.push(...bottom.slice(0, 3));
    next[d1] = [...top.slice(0, 17), ...bottom.slice(0, 3)];
    next[d2] = [...bottom.slice(3), ...top.slice(17)];
  });
  return { leagues: next, promoted, relegated };
}

// expected = the raw season delta before the rating factor; parts = its breakdown, biggest first.
export type ProgressionRow = { idolId: string; old: number; new: number; score: number; expected: number; reason: string; parts: Part[] };

// The rating each idol played the season with (taken from its matches).
const startRatings = (matches: SimMatch[]) => {
  const start = new Map<string, number>();
  for (const m of matches) start.set(m.idolA, m.ratingA).set(m.idolB, m.ratingB);
  return start;
};

// PRD §6.2 season score per idol: Σ points × prestige + 10 × (win rate − 0.5). Also ranks the season's top idols (Update 3 honours).
export function seasonScores(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>): Map<string, number> {
  const start = startRatings(matches);
  const record = new Map<string, { played: number; won: number }>();
  for (const m of matches) {
    for (const [idol, side] of [[m.idolA, "A"], [m.idolB, "B"]] as const) {
      const r = record.get(idol) ?? { played: 0, won: 0 };
      record.set(idol, { played: r.played + 1, won: r.won + (m.result === side ? 1 : m.result === "D" ? 0.5 : 0) });
    }
  }
  const points = seasonPoints(matches, titles, leagues, (id) => start.get(id) ?? 0);
  return new Map([...start.keys()].map((id) => { const r = record.get(id)!; return [id, (points.get(id) ?? 0) + 10 * (r.won / r.played - 0.5)]; }));
}

// The season's best idols over every competition, by season score (Update 3: the honours podium).
export const seasonTop = (scores: Map<string, number>, n = 3) => [...scores].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([id]) => id);

// How much of a positive season counts, by the rating it was played with (user 2026-11-15: too many idols reached 90+).
// Easy below 70, still a bit easy through the 70s, normal at 80, harder from there, harder still 86–90, hardest above 90. Piecewise linear.
const GAIN_CURVE: [number, number][] = [[55, 2.5], [65, 2], [72, 1.4], [80, 1], [86, 0.5], [90, 0.3], [95, 0.12], [100, 0.04]];
export function gainFactor(rating: number): number {
  if (rating <= GAIN_CURVE[0]![0]) return GAIN_CURVE[0]![1];
  const i = GAIN_CURVE.findIndex(([r]) => r >= rating);
  if (i < 0) return GAIN_CURVE.at(-1)![1];
  const [r0, f0] = GAIN_CURVE[i - 1]!, [r1, f1] = GAIN_CURVE[i]!;
  return f0 + ((rating - r0) / (r1 - r0)) * (f1 - f0);
}

// Season Progression (user 2026-11-15): the raw delta is the sum of the expectation parts (expectation.ts) — results
// against what the rating expects, win rate, giant kills, promotion / relegation. A gain is scaled by gainFactor(rating);
// a loss counts in full (down to −MAX_DROP), so a really poor season costs a lot. Running it again gives the same.
const MAX_DROP = 12;
const SLUMP = 2;
const slumpWeight = (rating: number) => 1 + 0.5 * Math.max(0, Math.min(1, (rating - 70) / 10)); // 1 at 70 and below, 1.5 from 80
export function seasonProgression(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>, plan: PromotionPlan): ProgressionRow[] {
  const start = startRatings(matches);
  const rating = (id: string) => start.get(id) ?? 0;
  const score = seasonScores(matches, titles, leagues);
  const parts = expectationParts(matches, seasonPlacements(matches, titles, leagues, rating), leagues, rating, { promoted: new Set(plan.promoted), relegated: new Set(plan.relegated) });
  const sign = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(1)}`;
  return [...start.keys()].map((id) => {
    const old = start.get(id)!;
    const mine = parts.get(id) ?? [];
    const sum = mine.reduce((total, p) => total + p.delta, 0);
    const raw = Math.max(-MAX_DROP, sum < -SLUMP ? -SLUMP + (sum + SLUMP) * slumpWeight(old) : sum); // past −2 a bad season counts up to 1.5× for a star
    const factor = raw > 0 ? gainFactor(old) : 1;
    const value = Math.max(1, Math.min(100, Math.round(old + raw * factor)));
    const reason = [...mine.slice(0, 3).map((p) => `${p.key} ${p.stage} ${sign(p.delta)}`), factor !== 1 && `× ${factor.toFixed(2)} (rating ${old})`].filter(Boolean).join(", ");
    return { idolId: id, old, new: value, score: score.get(id)!, expected: raw, reason, parts: mine };
  });
}
