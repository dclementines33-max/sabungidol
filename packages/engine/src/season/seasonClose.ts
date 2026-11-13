// Closing a season (PRD §4 "Penutupan", §6.1–6.3): achievement points per competition, Season
// Progression of ratings, and promotion/relegation (D1 18–20 ↔ D2 1–3 of the paired league).
// Choices made with the user (2026-11-13): knockout points by the round an idol went out in, a tie
// shares the average of its places (two SF losers without a 3rd-place match = 50); draws count half.
import { type CompetitionKey, D1_LEAGUES, D2_LEAGUES, competitionKeyOf } from "@sabung/shared";
import { computeStandings } from "../standings";
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

// A knockout or double-elimination bracket: 1 and 2 from the title, 3RD match winner/loser 3/4,
// everyone else ranked by the round of their last match (later = better), ties share places.
function bracketPlaces(matches: SimMatch[], title: Title | undefined): Map<string, number> {
  const places = new Map<string, number>();
  if (!title) return places;
  places.set(title.champion, 100).set(title.runnerUp, 70);
  const roundOrder = [...new Set(matches.map((m) => m.round))];
  const last = new Map<string, SimMatch>();
  for (const m of matches) { last.set(m.idolA, m); last.set(m.idolB, m); }
  let next = 3;
  const third = matches.find((m) => m.round === "3RD");
  if (third) {
    places.set(third.result === "A" ? third.idolA : third.idolB, placePoints(3, 3)).set(third.result === "A" ? third.idolB : third.idolA, placePoints(4, 4));
    next = 5;
  }
  const byRound = new Map<string, string[]>();
  for (const [idol, m] of last) if (!places.has(idol)) byRound.set(m.round, [...(byRound.get(m.round) ?? []), idol]);
  for (const round of [...roundOrder].reverse()) {
    const idols = byRound.get(round);
    if (!idols) continue;
    const value = placePoints(next, next + idols.length - 1);
    for (const idol of idols) places.set(idol, value);
    next += idols.length;
  }
  return places;
}

export function seasonPoints(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>, rating: (id: string) => number): Points {
  const points: Points = new Map();
  for (const [comp, roster] of Object.entries(leagues)) { // leagues and The Idols: 100 × (21 − rank) / 20
    const table = computeStandings(roster.map((id) => ({ id, startRating: rating(id) })), matches.filter((m) => m.comp === comp && m.stage === "LG"));
    for (const row of table) add(points, row.idolId, ((100 * (21 - row.rank)) / 20) * PRESTIGE[competitionKeyOf(comp)]);
  }
  const brackets = new Map<string, SimMatch[]>(); // title key → matches
  for (const m of matches) {
    if (m.stage === "LG" || m.comp === "SWS" || m.comp === "LCQ" || m.stage === "GS") continue;
    if (m.comp === "DSG" || m.comp === "MBK") { // one match: winner 100, loser 70
      add(points, m.result === "A" ? m.idolA : m.idolB, 100 * PRESTIGE[m.comp]);
      add(points, m.result === "A" ? m.idolB : m.idolA, 70 * PRESTIGE[m.comp]);
      continue;
    }
    const key = m.comp === "IDL" ? "IDL-PO" : m.comp;
    brackets.set(key, [...(brackets.get(key) ?? []), m]);
  }
  const unzureKo = new Map<string, number>();
  for (const [key, list] of brackets) {
    const places = bracketPlaces(list, titles[key]);
    if (key === "UZC") for (const [idol, p] of places) unzureKo.set(idol, p);
    else for (const [idol, p] of places) add(points, idol, p * PRESTIGE[competitionKeyOf(key === "IDL-PO" ? "IDL" : key)]);
  }
  const groupIdols = new Set(matches.filter((m) => m.comp === "UZC" && m.stage === "GS").flatMap((m) => [m.idolA, m.idolB]));
  for (const idol of new Set([...groupIdols, ...unzureKo.keys()])) { // Unzure: through the group 12, out in the group 5
    add(points, idol, Math.max(unzureKo.has(idol) ? 12 : 5, unzureKo.get(idol) ?? 0) * PRESTIGE.UZC);
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

// PRD §6.3, from the ratings the season was played with (so running it again gives the same result).
export function seasonProgression(matches: SimMatch[], titles: Partial<Record<string, Title>>, leagues: Record<string, string[]>, plan: PromotionPlan): ProgressionRow[] {
  const start = new Map<string, number>();
  const record = new Map<string, { played: number; won: number }>();
  for (const m of matches) {
    start.set(m.idolA, m.ratingA).set(m.idolB, m.ratingB);
    for (const [idol, side] of [[m.idolA, "A"], [m.idolB, "B"]] as const) {
      const r = record.get(idol) ?? { played: 0, won: 0 };
      record.set(idol, { played: r.played + 1, won: r.won + (m.result === side ? 1 : m.result === "D" ? 0.5 : 0) });
    }
  }
  const points = seasonPoints(matches, titles, leagues, (id) => start.get(id) ?? 0);
  const ids = [...start.keys()];
  const score = new Map(ids.map((id) => { const r = record.get(id)!; return [id, (points.get(id) ?? 0) + 10 * (r.won / r.played - 0.5)]; }));
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
