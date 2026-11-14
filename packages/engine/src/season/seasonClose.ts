// Closing a season (PRD §4 "Penutupan", §6.1–6.3): achievement points per competition, Season
// Progression of ratings, and promotion/relegation (D1 18–20 ↔ D2 1–3 of the paired league).
// Choices made with the user (2026-11-13): knockout points by the round an idol went out in, a tie
// shares the average of its places (two SF losers without a 3rd-place match = 50); draws count half.
import { type CompetitionKey, D1_LEAGUES, D2_LEAGUES, competitionKeyOf } from "@sabung/shared";
import { computeStandings } from "../standings";
import { seasonPlacements } from "./placements";
import type { SimMatch, Title } from "./types";

// Update 3 (user, 2026-11-14): Unzure > The Idols > D1 > Inkigayo > Nugu > B-Side > Daesang > Music Bank > D2.
export const PRESTIGE: Record<CompetitionKey, number> = { UZC: 1, SWS: 1, LCQ: 1, IDL: 0.9, D1: 0.8, INK: 0.7, NUG: 0.6, BS: 0.5, DSG: 0.4, MBK: 0.35, D2: 0.25 };
const PLACE_POINTS = [100, 70, 55, 45, 30, 30, 30, 30, ...Array(8).fill(20)]; // place 1..16, then 0
const placePoints = (from: number, to: number) => {
  let sum = 0;
  for (let p = from; p <= to; p++) sum += PLACE_POINTS[p - 1] ?? 0;
  return sum / (to - from + 1);
};

type Points = Map<string, number>; // idol → Σ points × prestige
const add = (points: Points, idol: string, value: number) => points.set(idol, (points.get(idol) ?? 0) + value);

// Points from the season's places (§6.2): leagues 100 × (21 − rank) / 20; brackets by place, a tie
// sharing the average of its places; Unzure: at least 12 through the group, 5 out in the group.
export function seasonPoints(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>, rating: (id: string) => number): Points {
  const points: Points = new Map();
  for (const p of seasonPlacements(matches, titles, leagues, rating)) {
    const prestige = PRESTIGE[competitionKeyOf(p.comp.split("-")[0]!)];
    const value = p.stageReached === "LG" ? (100 * (21 - p.finalRank)) / 20
      : p.comp === "UZC" ? (p.stageReached === "GS" ? 5 : Math.max(12, placePoints(p.finalRank, p.finalRank + p.tied - 1)))
      : placePoints(p.finalRank, p.finalRank + p.tied - 1);
    add(points, p.idolId, value * prestige);
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

export type ProgressionRow = { idolId: string; old: number; new: number; score: number; expected: number; reason: string };

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

// PRD §6.3 as changed in Update 3, from the ratings the season was played with (running it again gives the same result):
// performance (W-D-L and places vs what the rating expected, ±6) + titles (3 × prestige each, at most +5) + giant kills
// (+0.5 each, at most +2) ± 2 for promotion / relegation. A gain is scaled by gainFactor(rating); a loss counts in full,
// so a bad season costs more the worse it is.
// How much of a positive season counts, by the rating it was played with (user 2026-11-15: too many idols reached 90+).
// Easy below 70, still a bit easy through the 70s, normal at 80, harder from there, harder still 86–90, hardest above 90. Piecewise linear.
const GAIN_CURVE: [number, number][] = [[60, 1.6], [70, 1.4], [80, 1], [86, 0.45], [90, 0.2], [95, 0.08], [100, 0.03]];
export function gainFactor(rating: number): number {
  if (rating <= GAIN_CURVE[0]![0]) return GAIN_CURVE[0]![1];
  const i = GAIN_CURVE.findIndex(([r]) => r >= rating);
  if (i < 0) return GAIN_CURVE.at(-1)![1];
  const [r0, f0] = GAIN_CURVE[i - 1]!, [r1, f1] = GAIN_CURVE[i]!;
  return f0 + ((rating - r0) / (r1 - r0)) * (f1 - f0);
}

export function seasonProgression(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>, plan: PromotionPlan): ProgressionRow[] {
  const start = startRatings(matches);
  const score = seasonScores(matches, titles, leagues);
  const ids = [...start.keys()];
  // Least squares: expected score = a + b × rating.
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const mx = mean(ids.map((id) => start.get(id)!));
  const my = mean(ids.map((id) => score.get(id)!));
  const sxx = ids.reduce((s, id) => s + (start.get(id)! - mx) ** 2, 0);
  const b = sxx ? ids.reduce((s, id) => s + (start.get(id)! - mx) * (score.get(id)! - my), 0) / sxx : 0;
  const bonus = new Map<string, number>();
  for (const [key, t] of Object.entries(titles)) {
    if (!t) continue;
    const prestige = PRESTIGE[competitionKeyOf(key.split("-")[0]!)];
    bonus.set(t.champion, Math.min(5, (bonus.get(t.champion) ?? 0) + 3 * prestige));
  }
  const kills = new Map<string, number>(); // wins over an opponent rated 15+ higher
  for (const m of matches) {
    if (m.result === "A" && m.ratingB - m.ratingA >= 15) kills.set(m.idolA, (kills.get(m.idolA) ?? 0) + 1);
    if (m.result === "B" && m.ratingA - m.ratingB >= 15) kills.set(m.idolB, (kills.get(m.idolB) ?? 0) + 1);
  }
  const promoted = new Set(plan.promoted);
  const relegated = new Set(plan.relegated);
  return ids.map((id) => {
    const old = start.get(id)!;
    const expected = my + b * (old - mx);
    const delta = Math.max(-6, Math.min(6, 0.08 * (score.get(id)! - expected)));
    const champ = bonus.get(id) ?? 0;
    const upsets = Math.min(2, 0.5 * (kills.get(id) ?? 0));
    const move = promoted.has(id) ? 2 : relegated.has(id) ? -2 : 0;
    const raw = delta + champ + upsets + move;
    const factor = raw > 0 ? gainFactor(old) : 1;
    const value = Math.max(1, Math.min(100, Math.round(old + raw * factor)));
    const reason = [`form ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`, champ && `titles +${champ.toFixed(1)}`, upsets && `upset +${upsets}`,
      move && (move > 0 ? "promotion +2" : "relegation −2"), factor !== 1 && `× ${factor.toFixed(2)} (rating ${old})`].filter(Boolean).join(", ");
    return { idolId: id, old, new: value, score: score.get(id)!, expected, reason };
  });
}
