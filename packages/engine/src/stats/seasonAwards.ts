// End-of-season awards (2026-11-17, user via router), most prestigious first. Pure, from the season's matches and titles;
// growth (rating change at season end) and badges (achievements this season) come from the caller. Rate awards need
// MIN_MATCHES so a short season can't win them; every tie falls to the next rule, then to the idol id (never random).
import { computeStandings } from "../standings";
import type { SimMatch, Title } from "../season/types";

export const AWARDS = ["mvi", "golden-disk", "chart-topper", "encore", "daebak", "hit-maker", "unbreakable", "trend-setter", "glow-up", "hallyu-wave"] as const;
export type AwardKey = (typeof AWARDS)[number];
export type Award = { key: AwardKey; idol: string; value: number };

export const MIN_MATCHES = 20; // MVI, Daebak, Unbreakable, Trend Setter
const MIN_COMP = 3; // Trend Setter: a competition counts with this many matches…
const MIN_COMPS = 3; // …and needs this many competitions

type Line = { id: string; m: number; w: number; d: number; l: number; gf: number; ga: number; comps: Map<string, { m: number; w: number }> };

// Best by the keys in order (higher first; negate for lower), then idol id.
function best(lines: Line[], keys: ((x: Line) => number)[]): Line | undefined {
  return [...lines].sort((a, b) => {
    for (const k of keys) if (k(b) !== k(a)) return k(b) - k(a);
    return a.id.localeCompare(b.id);
  })[0];
}

// Matchdays each idol led The Idols league or a Division 1 league (after that matchday's results).
function daysAtTop(matches: SimMatch[]): Map<string, number> {
  const days = new Map<string, number>();
  const leagues = new Map<string, SimMatch[]>();
  for (const m of matches) if (m.stage === "LG" && (m.comp === "IDL" || m.comp.startsWith("D1"))) leagues.set(m.comp, [...(leagues.get(m.comp) ?? []), m]);
  for (const list of leagues.values()) {
    const ids = [...new Set(list.flatMap((m) => [m.idolA, m.idolB]))];
    const rating = new Map(list.flatMap((m) => [[m.idolA, m.ratingA], [m.idolB, m.ratingB]] as const));
    const md = (m: SimMatch) => Number(m.round.slice(2));
    for (let day = 1; day <= Math.max(...list.map(md)); day++) {
      const top = computeStandings(ids.map((id) => ({ id, startRating: rating.get(id)! })), list.filter((m) => md(m) <= day))[0]!.idolId;
      days.set(top, (days.get(top) ?? 0) + 1);
    }
  }
  return days;
}

export function seasonAwards(matches: SimMatch[], titles: Partial<Record<string, Title>>, growth: Map<string, number> = new Map(), badges: Map<string, number> = new Map()): Award[] {
  const lines = new Map<string, Line>();
  const line = (id: string) => lines.get(id) ?? lines.set(id, { id, m: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, comps: new Map() }).get(id)!;
  for (const x of matches) {
    for (const [id, gf, ga, won, lost] of [[x.idolA, x.scoreA, x.scoreB, x.result === "A", x.result === "B"], [x.idolB, x.scoreB, x.scoreA, x.result === "B", x.result === "A"]] as const) {
      const r = line(id);
      r.m++; r.gf += gf; r.ga += ga;
      if (won) r.w++; else if (lost) r.l++; else r.d++;
      const c = r.comps.get(x.comp) ?? { m: 0, w: 0 };
      r.comps.set(x.comp, { m: c.m + 1, w: c.w + (won ? 1 : 0) });
    }
  }
  const all = [...lines.values()];
  const regular = all.filter((r) => r.m >= MIN_MATCHES);
  const titlesOf = new Map<string, number>();
  for (const t of Object.values(titles)) if (t) titlesOf.set(t.champion, (titlesOf.get(t.champion) ?? 0) + 1);
  const top = daysAtTop(matches);
  // Trend Setter: steady and good — mean minus spread of the win rates in each competition played enough.
  const steady = (r: Line) => {
    const rates = [...r.comps.values()].filter((c) => c.m >= MIN_COMP).map((c) => c.w / c.m);
    if (rates.length < MIN_COMPS) return -Infinity;
    const mean = rates.reduce((s, x) => s + x, 0) / rates.length;
    return mean - Math.sqrt(rates.reduce((s, x) => s + (x - mean) ** 2, 0) / rates.length);
  };
  const mvi = (r: Line) => (100 * r.w) / r.m + (10 * (r.gf - r.ga)) / r.m; // win rate % + game difference per match × 10

  const out: Award[] = [];
  const add = (key: AwardKey, r: Line | undefined, value: (r: Line) => number, ok = (_r: Line) => true) => { if (r && ok(r)) out.push({ key, idol: r.id, value: value(r) }); };
  add("mvi", best(regular, [mvi, (r) => r.w]), (r) => Math.round(mvi(r) * 10) / 10);
  add("golden-disk", best(all, [(r) => titlesOf.get(r.id) ?? 0, (r) => badges.get(r.id) ?? 0, (r) => r.w]), (r) => titlesOf.get(r.id) ?? 0, (r) => titlesOf.has(r.id));
  add("chart-topper", best(all, [(r) => top.get(r.id) ?? 0, (r) => r.w]), (r) => top.get(r.id) ?? 0, (r) => top.has(r.id));
  add("encore", best(all, [(r) => r.w, (r) => -r.l]), (r) => r.w);
  add("daebak", best(regular, [(r) => -r.l, (r) => r.m, (r) => r.w]), (r) => r.l);
  add("hit-maker", best(all, [(r) => r.gf, (r) => -r.ga]), (r) => r.gf);
  add("unbreakable", best(regular, [(r) => -r.ga / r.m, (r) => r.m]), (r) => Math.round((r.ga / r.m) * 100) / 100);
  add("trend-setter", best(regular, [steady, (r) => r.comps.size]), (r) => Math.round(steady(r) * 100), (r) => steady(r) > -Infinity);
  add("glow-up", best(all, [(r) => growth.get(r.id) ?? 0, (r) => r.w]), (r) => growth.get(r.id) ?? 0, (r) => (growth.get(r.id) ?? 0) > 0);
  add("hallyu-wave", best(all, [(r) => r.m, (r) => r.w]), (r) => r.m);
  return out;
}
