// Season-end expectation model (user 2026-11-15): every result is judged against what an idol of that rating is expected
// to do in that competition this season. Per competition group, "expected" is a straight-line fit of the achievement value
// (0–100, the same place values as the season points) against rating over everyone who took part; every Division 1 idol
// counts in the Unzure Cup group, so missing the Unzure Cup is a disappointment too. A part = prestige × (actual −
// expected) × K, so beating expectations gives + and missing them gives −. Win rate vs expected, giant kills and
// promotion / relegation are parts as well. The sum is the raw season delta; seasonProgression scales gains by rating.
import { type CompetitionKey, D1_LEAGUES, competitionKeyOf } from "@sabung/shared";
import type { Placement } from "./placements";
import type { SimMatch } from "./types";

export type Part = { key: string; stage: string; delta: number }; // key = a competition code, or "record" / "giants" / "move"

const K = 0.05; // a league title for a top idol ≈ +1, an Unzure group exit for one ≈ −1.4
const RECORD = 10; // per 1.0 of win rate above / below expected
const PLACE_POINTS = [100, 70, 55, 45, 30, 30, 30, 30, ...Array(8).fill(20)]; // place 1..16, then 0

// Update 3 (user, 2026-11-14): Unzure > The Idols > D1 > Inkigayo > Nugu > B-Side > Daesang > Music Bank > D2.
export const PRESTIGE: Record<CompetitionKey, number> = { UZC: 1, SWS: 1, LCQ: 1, IDL: 0.9, D1: 0.8, INK: 0.7, NUG: 0.6, BS: 0.5, DSG: 0.4, MBK: 0.35, D2: 0.25 };
export const prestigeOf = (comp: string) => PRESTIGE[competitionKeyOf(comp.split("-")[0]!)];

const placePoints = (from: number, to: number) => {
  let sum = 0;
  for (let p = from; p <= to; p++) sum += PLACE_POINTS[p - 1] ?? 0;
  return sum / (to - from + 1);
};

// Achievement value of one place, 0–100 (§6.2): leagues by rank, brackets by place (ties share), Unzure group exit 5.
export function placeValue(p: Placement): number {
  if (p.stageReached === "LG") return (100 * (21 - p.finalRank)) / 20;
  if (p.comp === "UZC") return p.stageReached === "GS" ? 5 : Math.max(12, placePoints(p.finalRank, p.finalRank + p.tied - 1));
  return placePoints(p.finalRank, p.finalRank + p.tied - 1);
}

// What a part is called in the breakdown: league rank, "won", "final", a knockout round, "groups", "missed".
const stageOf = (p: Placement) => (p.stageReached === "LG" ? `#${p.finalRank}` : p.stageReached === "W" ? "won" : p.stageReached === "F" ? "final" : p.stageReached === "GS" ? "groups" : p.stageReached);
const groupOf = (comp: string) => (comp.startsWith("D1") || comp.startsWith("D2") ? comp.slice(0, 2) : comp.startsWith("BS") ? "BS" : comp.startsWith("MBK") ? "MBK" : comp);

// expected = a + b × rating, fitted over the points; with too few points or no spread, the mean.
function fit(points: { r: number; v: number }[]) {
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const mr = mean(points.map((p) => p.r));
  const mv = mean(points.map((p) => p.v));
  const sxx = points.reduce((s, p) => s + (p.r - mr) ** 2, 0);
  const b = points.length >= 3 && sxx ? points.reduce((s, p) => s + (p.r - mr) * (p.v - mv), 0) / sxx : 0;
  return (r: number) => mv + b * (r - mr);
}

// Achievement per idol and competition (0–100) and what her rating expected there, fitted per competition group.
export type PlaceExpectation = { id: string; comp: string; stage: string; actual: number; expected: number };
export function placeExpectations(matches: SimMatch[], placements: Placement[], leagues: Record<string, string[]>, rating: (id: string) => number): PlaceExpectation[] {
  // Places, per competition group (all D1 leagues together, every B-Side cup together …).
  const rows = placements.map((p) => ({ id: p.idolId, comp: p.comp, group: groupOf(p.comp), stage: stageOf(p), v: placeValue(p) }));
  const inUzc = new Set(rows.filter((x) => x.comp === "UZC").map((x) => x.id));
  for (const id of D1_LEAGUES.flatMap((c) => leagues[c] ?? [])) if (!inUzc.has(id)) rows.push({ id, comp: "UZC", group: "UZC", stage: "missed", v: 0 });
  // Swiss and LCQ have no places: the share of their matches won.
  for (const comp of ["SWS", "LCQ"]) {
    const won = new Map<string, [number, number]>();
    for (const m of matches.filter((x) => x.comp === comp)) for (const [id, side] of [[m.idolA, "A"], [m.idolB, "B"]] as const) {
      const [w, n] = won.get(id) ?? [0, 0];
      won.set(id, [w + (m.result === side ? 1 : m.result === "D" ? 0.5 : 0), n + 1]);
    }
    for (const [id, [w, n]] of won) rows.push({ id, comp, group: comp, stage: `${w}/${n}`, v: (100 * w) / n });
  }
  const out: PlaceExpectation[] = [];
  for (const group of new Set(rows.map((x) => x.group))) {
    const mine = rows.filter((x) => x.group === group);
    const expected = fit(mine.map((x) => ({ r: rating(x.id), v: x.v })));
    for (const x of mine) out.push({ id: x.id, comp: x.comp, stage: x.stage, actual: x.v, expected: expected(rating(x.id)) });
  }
  return out;
}

export function expectationParts(matches: SimMatch[], placements: Placement[], leagues: Record<string, string[]>, rating: (id: string) => number,
  move: { promoted: Set<string>; relegated: Set<string> }): Map<string, Part[]> {
  const parts = new Map<string, Part[]>();
  const push = (id: string, part: Part) => { if (Math.abs(part.delta) >= 0.05) parts.set(id, [...(parts.get(id) ?? []), part]); };
  for (const x of placeExpectations(matches, placements, leagues, rating)) push(x.id, { key: x.comp, stage: x.stage, delta: prestigeOf(x.comp) * (x.actual - x.expected) * K });

  // Win rate over the whole season vs what the rating expects.
  const record = new Map<string, [number, number]>();
  for (const m of matches) for (const [id, side] of [[m.idolA, "A"], [m.idolB, "B"]] as const) {
    const [w, n] = record.get(id) ?? [0, 0];
    record.set(id, [w + (m.result === side ? 1 : m.result === "D" ? 0.5 : 0), n + 1]);
  }
  const rate = [...record].map(([id, [w, n]]) => ({ id, r: rating(id), v: w / n }));
  const expectedRate = fit(rate);
  for (const x of rate) push(x.id, { key: "record", stage: `${Math.round(x.v * 100)}%`, delta: (x.v - expectedRate(x.r)) * RECORD });

  // Giant kills (+0.5 each over an opponent rated 15+ higher, at most +2) and promotion / relegation (±1).
  const kills = new Map<string, number>();
  for (const m of matches) {
    if (m.result === "A" && m.ratingB - m.ratingA >= 15) kills.set(m.idolA, (kills.get(m.idolA) ?? 0) + 1);
    if (m.result === "B" && m.ratingA - m.ratingB >= 15) kills.set(m.idolB, (kills.get(m.idolB) ?? 0) + 1);
  }
  for (const [id, n] of kills) push(id, { key: "giants", stage: `${n}×`, delta: Math.min(2, 0.5 * n) });
  for (const id of move.promoted) push(id, { key: "move", stage: "promoted", delta: 1 });
  for (const id of move.relegated) push(id, { key: "move", stage: "relegated", delta: -1 });

  for (const [id, list] of parts) parts.set(id, list.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)));
  return parts;
}
