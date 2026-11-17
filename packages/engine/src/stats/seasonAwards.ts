// End-of-season awards (2026-11-17 rework, user via router), most prestigious first: two headline awards (MVI, Idol of the
// Season), MAMA for the best group, then the rest. Every match / title counts by its tournament tier — the same PRESTIGE
// table as the rating model (season/expectation.ts). Pure, from the season's matches and titles; growth, badges, season
// scores and groups come from the caller. Rate awards need MIN_MATCHES; every tie falls to the next rule, then the id.
// Each award keeps its top 10 (nominees), winner first. MAMA's ids are group ids. Rules: docs/PROGRESS.md.
import { prestigeOf } from "../season/expectation";
import type { SimMatch, Title } from "../season/types";
import { computeStandings } from "../standings";

export const AWARDS = ["mvi", "iots", "mama", "golden-disk", "chart-topper", "encore", "daebak", "unbreakable", "trend-setter", "glow-up", "hallyu-wave"] as const;
export type AwardKey = (typeof AWARDS)[number];
export type Nominee = { id: string; value: number };
export type Award = { key: AwardKey; id: string; value: number; top: Nominee[] };
export type AwardInput = { growth?: Map<string, number>; badges?: Map<string, number>; scores?: Map<string, number>; groups?: Map<string, string | null> };

export const MIN_MATCHES = 20; // MVI, Daebak, Unbreakable, Trend Setter
export const NOMINEES = 10;
export const MAMA_MEMBERS = 3; // a group is judged by its best three members, so its size barely matters
const MIN_COMP = 3; // Trend Setter: a competition counts once she played this many matches in it

// Rating bonus at season end (added after Season Progression, capped): winners only; MAMA = each counted member.
export const AWARD_BONUS: Record<AwardKey, number> = { mvi: 2, iots: 2, mama: 1, "golden-disk": 1, "chart-topper": 1, encore: 1, daebak: 1, unbreakable: 1, "trend-setter": 1, "glow-up": 1, "hallyu-wave": 1 };
export const MAX_AWARD_BONUS = 3;

// m, w, l, gf, ga = plain counts; t* = the same, each match × its tier.
type Line = { id: string; m: number; w: number; l: number; tm: number; tw: number; tl: number; tgd: number; tga: number; comps: Map<string, { m: number; w: number; l: number }> };

// Ranked by the keys in order (higher first; negate for lower), then id; only those `ok` lets in; top NOMINEES.
function rank<T extends { id: string }>(rows: T[], keys: ((x: T) => number)[], ok: (x: T) => boolean = () => true): T[] {
  return rows.filter(ok).sort((a, b) => {
    for (const k of keys) if (k(b) !== k(a)) return k(b) - k(a);
    return a.id.localeCompare(b.id);
  }).slice(0, NOMINEES);
}

// Tier-weighted matchdays each idol led The Idols league or a Division 1 league (after that matchday's results).
function daysAtTop(matches: SimMatch[]): Map<string, number> {
  const days = new Map<string, number>();
  const leagues = new Map<string, SimMatch[]>();
  for (const m of matches) if (m.stage === "LG" && (m.comp === "IDL" || m.comp.startsWith("D1"))) leagues.set(m.comp, [...(leagues.get(m.comp) ?? []), m]);
  for (const [comp, list] of leagues) {
    const ids = [...new Set(list.flatMap((m) => [m.idolA, m.idolB]))];
    const rating = new Map(list.flatMap((m) => [[m.idolA, m.ratingA], [m.idolB, m.ratingB]] as const));
    const md = (m: SimMatch) => Number(m.round.slice(2));
    for (let day = 1; day <= Math.max(...list.map(md)); day++) {
      const top = computeStandings(ids.map((id) => ({ id, startRating: rating.get(id)! })), list.filter((m) => md(m) <= day))[0]!.idolId;
      days.set(top, (days.get(top) ?? 0) + prestigeOf(comp));
    }
  }
  return days;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

export function seasonAwards(matches: SimMatch[], titles: Partial<Record<string, Title>>, { growth = new Map(), badges = new Map(), scores, groups }: AwardInput = {}): Award[] {
  const lines = new Map<string, Line>();
  const line = (id: string) => lines.get(id) ?? lines.set(id, { id, m: 0, w: 0, l: 0, tm: 0, tw: 0, tl: 0, tgd: 0, tga: 0, comps: new Map() }).get(id)!;
  for (const x of matches) {
    const t = prestigeOf(x.comp);
    for (const [id, gf, ga, won, lost] of [[x.idolA, x.scoreA, x.scoreB, x.result === "A", x.result === "B"], [x.idolB, x.scoreB, x.scoreA, x.result === "B", x.result === "A"]] as const) {
      const r = line(id);
      r.m++; r.tm += t; r.tgd += t * (gf - ga); r.tga += t * ga;
      if (won) { r.w++; r.tw += t; } else if (lost) { r.l++; r.tl += t; }
      const c = r.comps.get(x.comp) ?? { m: 0, w: 0, l: 0 };
      r.comps.set(x.comp, { m: c.m + 1, w: c.w + (won ? 1 : 0), l: c.l + (lost ? 1 : 0) });
    }
  }
  const all = [...lines.values()];
  const regular = (r: Line) => r.m >= MIN_MATCHES;
  const titleCount = new Map<string, number>();
  const titlePoints = new Map<string, number>();
  for (const [comp, t] of Object.entries(titles)) if (t) {
    titleCount.set(t.champion, (titleCount.get(t.champion) ?? 0) + 1);
    titlePoints.set(t.champion, (titlePoints.get(t.champion) ?? 0) + prestigeOf(comp));
  }
  const top = daysAtTop(matches);
  // MVI: win rate % + 10 × game difference, per match, each match × its tier.
  const mvi = (r: Line) => (100 * r.tw + 10 * r.tgd) / r.m;
  // Trend Setter: the competitions she won more matches than she lost in (≥ MIN_COMP played), each × its tier.
  const winning = (r: Line) => [...r.comps].filter(([, c]) => c.m >= MIN_COMP && c.w > c.l);
  const trend = (r: Line) => winning(r).reduce((s, [comp]) => s + prestigeOf(comp), 0);

  const out: Award[] = [];
  const add = <T extends { id: string }>(key: AwardKey, ranked: T[], value: (x: T) => number) => {
    if (ranked.length) { const nominees = ranked.map((x) => ({ id: x.id, value: value(x) })); out.push({ key, ...nominees[0]!, top: nominees }); }
  };
  add("mvi", rank(all, [mvi, (r) => r.w], regular), (r) => r1(mvi(r)));
  if (scores) add("iots", rank([...scores].map(([id, v]) => ({ id, v })), [(x) => x.v]), (x) => r1(x.v));
  if (scores && groups) {
    const members = new Map<string, number[]>();
    for (const [id, v] of scores) { const g = groups.get(id); if (g) members.set(g, [...(members.get(g) ?? []), v]); }
    const sum = (vs: number[]) => [...vs].sort((a, b) => b - a).slice(0, MAMA_MEMBERS).reduce((s, v) => s + v, 0);
    add("mama", rank([...members].map(([id, vs]) => ({ id, v: sum(vs) })), [(x) => x.v]), (x) => r1(x.v));
  }
  add("golden-disk", rank(all, [(r) => titlePoints.get(r.id) ?? 0, (r) => titleCount.get(r.id) ?? 0, (r) => badges.get(r.id) ?? 0, (r) => r.w], (r) => titlePoints.has(r.id)), (r) => r2(titlePoints.get(r.id)!));
  add("chart-topper", rank(all, [(r) => top.get(r.id) ?? 0, (r) => r.w], (r) => top.has(r.id)), (r) => r1(top.get(r.id)!));
  add("encore", rank(all, [(r) => r.tw, (r) => -r.l]), (r) => r1(r.tw));
  add("daebak", rank(all, [(r) => -r.tl / r.tm, (r) => r.tm, (r) => r.w], regular), (r) => r1((100 * r.tl) / r.tm));
  add("unbreakable", rank(all, [(r) => -r.tga / r.tm, (r) => r.tm], regular), (r) => r2(r.tga / r.tm));
  add("trend-setter", rank(all, [trend, (r) => winning(r).length, (r) => r.w], (r) => regular(r) && trend(r) > 0), (r) => r2(trend(r)));
  add("glow-up", rank(all, [(r) => growth.get(r.id) ?? 0, (r) => r.w], (r) => (growth.get(r.id) ?? 0) > 0), (r) => growth.get(r.id)!);
  add("hallyu-wave", rank(all, [(r) => r.tm, (r) => r.w]), (r) => r1(r.tm));
  return out;
}

// Each idol's award bonus (winners; MAMA = the group's counted members), capped at MAX_AWARD_BONUS.
export function awardBonus(awards: Award[], scores: Map<string, number> = new Map(), groups: Map<string, string | null> = new Map()): Map<string, number> {
  const bonus = new Map<string, number>();
  const give = (id: string, n: number) => bonus.set(id, Math.min(MAX_AWARD_BONUS, (bonus.get(id) ?? 0) + n));
  for (const a of awards) {
    if (a.key !== "mama") { give(a.id, AWARD_BONUS[a.key]); continue; }
    const counted = [...scores].filter(([id]) => groups.get(id) === a.id).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, MAMA_MEMBERS);
    for (const [id] of counted) give(id, AWARD_BONUS.mama);
  }
  return bonus;
}
