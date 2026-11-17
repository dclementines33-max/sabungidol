// Ranking panel (2026-11-17): the Sabung Index, one all-time number per idol from everything she did — titles weighted
// by the competition's prestige, finals and podiums, season awards, win rate (counted fully from 60 matches), current
// rating and feats. A girl group = its best four members plus 20 per MAMA. The weights are ours (no PRD numbers).
import { AWARD_BONUS, type AwardKey, type CareerRow, PRESTIGE } from "@sabung/engine";

export type IndexParts = { titles: number; podiums: number; awards: number; form: number; rating: number; feats: number };
export type IndexRow = { id: string; score: number; parts: IndexParts; members?: string[] };
export const PARTS: { key: keyof IndexParts; label: string }[] = [
  { key: "titles", label: "Titles" }, { key: "podiums", label: "Finals & podiums" }, { key: "awards", label: "Awards" },
  { key: "form", label: "Win rate" }, { key: "rating", label: "Rating" }, { key: "feats", label: "Feats" },
];

const FULL_FORM_AT = 60; // matches before the win rate counts in full
const GROUP_CORE = 4;
const MAMA_POINTS = 20;
const r1 = (n: number) => Math.round(n * 10) / 10;
const total = (p: IndexParts) => r1(p.titles + p.podiums + p.awards + p.form + p.rating + p.feats);

type IdolIn = { id: string; rating: number; groupId: string | null };
type TitleIn = { idolId: string; comp: string; titles: number };
type AwardIn = { key: string; id: string };

export function idolIndex(idols: IdolIn[], career: CareerRow[], titles: TitleIn[], awards: AwardIn[]): IndexRow[] {
  const all = new Map(career.filter((r) => r.comp === "ALL").map((r) => [r.idolId, r]));
  const titlePts = new Map<string, number>();
  for (const t of titles) titlePts.set(t.idolId, (titlePts.get(t.idolId) ?? 0) + t.titles * (PRESTIGE[t.comp as keyof typeof PRESTIGE] ?? 0.5) * 12);
  const awardPts = new Map<string, number>();
  for (const a of awards) if (a.key !== "mama") awardPts.set(a.id, (awardPts.get(a.id) ?? 0) + (AWARD_BONUS[a.key as AwardKey] ?? 1) * 8);
  return idols.map((i) => {
    const c = all.get(i.id);
    const parts: IndexParts = {
      titles: r1(titlePts.get(i.id) ?? 0),
      podiums: c ? r1(c.runnerUp * 4 + c.third * 2 + c.finals) : 0,
      awards: awardPts.get(i.id) ?? 0,
      form: c ? r1(c.winRate * 40 * Math.min(1, c.matches / FULL_FORM_AT)) : 0,
      rating: r1(Math.max(0, i.rating - 50) * 0.6),
      feats: c ? r1(c.giantKills * 0.6 + c.invincibleSeasons * 6 + c.reverseSweeps * 0.5 + c.bestWinStreak * 0.4) : 0,
    };
    return { id: i.id, score: total(parts), parts, rating: i.rating };
  }).sort((a, b) => b.score - a.score || b.rating - a.rating || a.id.localeCompare(b.id)).map(({ rating: _, ...row }) => row);
}

export function groupIndex(idols: IdolIn[], ranked: IndexRow[], mama: AwardIn[]): IndexRow[] {
  const groupOf = new Map(idols.map((i) => [i.id, i.groupId]));
  const members = new Map<string, IndexRow[]>();
  for (const row of ranked) { const g = groupOf.get(row.id); if (g) members.set(g, [...(members.get(g) ?? []), row]); } // ranked = best first
  return [...members].map(([id, rows]) => {
    const core = rows.slice(0, GROUP_CORE);
    const parts = Object.fromEntries((Object.keys(core[0]!.parts) as (keyof IndexParts)[]).map((k) => [k, r1(core.reduce((n, r) => n + r.parts[k], 0))])) as IndexParts;
    parts.awards = r1(parts.awards + mama.filter((a) => a.key === "mama" && a.id === id).length * MAMA_POINTS);
    return { id, score: total(parts), parts, members: rows.map((r) => r.id) };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
