// Closing a season (PRD §4 "Penutupan", §6.1–6.3): achievement points per competition, Season
// Progression of ratings, and promotion/relegation (D1 18–20 ↔ D2 1–3 of the paired league).
// Choices made with the user (2026-11-13): knockout points by the round an idol went out in, a tie
// shares the average of its places (two SF losers without a 3rd-place match = 50); draws count half.
import { type CompetitionKey, D1_LEAGUES, D2_LEAGUES, competitionKeyOf } from "@sabung/shared";
import { computeStandings } from "../standings";
import { seasonPlacements } from "./placements";
import type { SimMatch, Title } from "./types";

export const PRESTIGE: Record<CompetitionKey, number> = { UZC: 1, SWS: 1, LCQ: 1, IDL: 0.9, INK: 0.75, D1: 0.7, DSG: 0.55, MBK: 0.45, NUG: 0.4, BS: 0.35, D2: 0.25 };
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

// PRD §6.3, from the ratings the season was played with (so running it again gives the same result).
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
    bonus.set(t.champion, Math.min(3, (bonus.get(t.champion) ?? 0) + (prestige >= 0.7 ? 2 : 1)));
  }
  const promoted = new Set(plan.promoted);
  const relegated = new Set(plan.relegated);
  return ids.map((id) => {
    const old = start.get(id)!;
    const expected = my + b * (old - mx);
    const delta = Math.max(-6, Math.min(6, 0.08 * (score.get(id)! - expected)));
    const champ = bonus.get(id) ?? 0;
    const regression = old > 92 ? -0.03 * (old - mx) : 0;
    const move = promoted.has(id) ? 2 : relegated.has(id) ? -2 : 0;
    const value = Math.max(1, Math.min(100, Math.round(old + delta + champ + regression + move)));
    const reason = [`performa ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`, champ && `juara +${champ}`, regression && `regresi ${regression.toFixed(1)}`, move && (move > 0 ? "promosi +2" : "degradasi −2")].filter(Boolean).join(", ");
    return { idolId: id, old, new: value, score: score.get(id)!, expected, reason };
  });
}
