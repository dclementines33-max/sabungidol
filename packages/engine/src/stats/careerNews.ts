// Season Story kinds that need earlier seasons (2026-11-16): a rivalry renewed (pairs that met often before) and a farewell
// (an idol now inactive who played earlier seasons). The Worker reads the counts; this only picks and shapes them.
import type { SimMatch } from "../season/types";

export type CareerStory =
  | { kind: "rivalry-renewed"; a: string; b: string; meetings: number; earlier: number }
  | { kind: "farewell"; idol: string; titles: number };

const MIN_EARLIER = 3;

// The n pairs that met most this season, [a, b, meetings] with a < b.
export function topPairs(matches: SimMatch[], n = 3): [string, string, number][] {
  const count = new Map<string, number>();
  for (const m of matches) { const key = [m.idolA, m.idolB].sort().join("|"); count.set(key, (count.get(key) ?? 0) + 1); }
  return [...count].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, n).map(([k, c]) => [...(k.split("|") as [string, string]), c]);
}

export function careerNews(pairs: [string, string, number, number][], gone: { idol: string; titles: number }[]): CareerStory[] {
  const renewed = pairs.filter(([, , , earlier]) => earlier >= MIN_EARLIER).map(([a, b, meetings, earlier]): CareerStory => ({ kind: "rivalry-renewed", a, b, meetings, earlier }));
  const farewells = [...gone].sort((x, y) => y.titles - x.titles || x.idol.localeCompare(y.idol)).slice(0, 3).map((g): CareerStory => ({ kind: "farewell", ...g }));
  return [...renewed, ...farewells];
}
