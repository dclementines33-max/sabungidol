// Season Story kinds that need earlier seasons (2026-11-16): a rivalry renewed (pairs that met often before), a farewell
// (an idol now inactive who played earlier seasons) and career trajectories (runner-up streaks, droughts, repeat champions,
// promotion/relegation stories). The Worker reads the counts and placements; this only picks and shapes them.
import type { SimMatch } from "../season/types";

export type CareerStory =
  | { kind: "rivalry-renewed"; a: string; b: string; meetings: number; earlier: number }
  | { kind: "farewell"; idol: string; titles: number }
  | { kind: "runner-up-streak"; idol: string; seasons: number }
  | { kind: "finalist-streak"; idol: string; seasons: number } // Unzure Cup finalist, never the winner
  | { kind: "drought"; idol: string; seasons: number; rating: number }
  | { kind: "drought-ended"; idol: string; comp: string; gap: number }
  | { kind: "repeat-champion"; idol: string; comp: string; seasons: number }
  | { kind: "promoted-champion"; idol: string; league: string }
  | { kind: "relegated-again"; idol: string; league: string }
  | { kind: "stuck-in-d2"; idol: string; seasons: number; rating: number }
  | { kind: "early-exit-again"; idol: string; times: number; rating: number }; // no Unzure Cup, or out in its group stage, in 2+ of the last 3 seasons

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

// Thresholds (ours, no PRD figure): "top tier" = rating 90+ (tier S), a drought = 4 seasons without a title, relegated again = twice in 4 seasons.
const TOP = 90, DROUGHT = 4, AGAIN = 3, CAP = 3;
export type Placed = { season: number; idolId: string; comp: string; finalRank: number; stage?: string | null };

// Trajectory stories for the idols who played season `cur`; `rows` = every placement up to and including `cur`. At most CAP per kind.
export function trajectoryNews(rows: Placed[], cur: number, rating: (id: string) => number): CareerStory[] {
  const by = new Map<string, Placed[]>();
  for (const r of rows) by.set(r.idolId, [...(by.get(r.idolId) ?? []), r]);
  const size = (r: Placed) => rows.filter((x) => x.season === r.season && x.comp === r.comp).length;
  const relegated = (r: Placed) => /^D1/.test(r.comp) && r.finalRank > size(r) - 2; // the bottom two go down
  const out: CareerStory[] = [];
  for (const [idol, mine] of by) {
    const at = (s: number) => mine.filter((r) => r.season === s);
    if (!at(cur).length) continue;
    const streak = (pred: (rs: Placed[]) => boolean) => { let n = 0; while (pred(at(cur - n))) n++; return n; };
    const won = (rs: Placed[]) => rs.some((r) => r.finalRank === 1);
    const now = at(cur).filter((r) => r.finalRank === 1);
    const r = rating(idol);
    const second = streak((rs) => rs.some((x) => x.finalRank === 2) && !won(rs));
    if (second >= 2) out.push({ kind: "runner-up-streak", idol, seasons: second });
    const finalist = streak((rs) => rs.some((x) => x.comp === "UZC" && x.finalRank === 2) && !rs.some((x) => x.comp === "UZC" && x.finalRank === 1));
    if (finalist >= 2) out.push({ kind: "finalist-streak", idol, seasons: finalist });
    for (const t of now) { const n = streak((rs) => rs.some((x) => x.comp === t.comp && x.finalRank === 1)); if (n >= 2) out.push({ kind: "repeat-champion", idol, comp: t.comp, seasons: n }); }
    const lastTitle = Math.max(0, ...mine.filter((x) => x.finalRank === 1 && x.season < cur).map((x) => x.season));
    if (now.length && lastTitle && cur - lastTitle >= DROUGHT) out.push({ kind: "drought-ended", idol, comp: now[0]!.comp, gap: cur - lastTitle });
    const dry = streak((rs) => rs.length > 0 && !won(rs));
    if (r >= TOP && dry >= DROUGHT) out.push({ kind: "drought", idol, seasons: dry, rating: r });
    const up = now.find((x) => /^D1/.test(x.comp));
    if (up && at(cur - 1).some((x) => /^D2/.test(x.comp))) out.push({ kind: "promoted-champion", idol, league: up.comp });
    const down = at(cur).find(relegated);
    if (down && Array.from({ length: AGAIN }, (_, i) => at(cur - 1 - i)).some((rs) => rs.some(relegated))) out.push({ kind: "relegated-again", idol, league: down.comp });
    const early = (rs: Placed[]) => rs.length > 0 && !rs.some((x) => x.comp === "UZC" && x.stage !== "GS");
    const times = [0, 1, 2].filter((i) => early(at(cur - i))).length;
    if (r >= TOP && early(at(cur)) && times >= 2) out.push({ kind: "early-exit-again", idol, times, rating: r });
    const d2 = streak((rs) => rs.some((x) => /^D2/.test(x.comp)));
    if (r >= TOP && d2 >= 2) out.push({ kind: "stuck-in-d2", idol, seasons: d2, rating: r });
  }
  const seen = new Map<string, number>();
  return out.filter((s) => { const n = seen.get(s.kind) ?? 0; seen.set(s.kind, n + 1); return n < CAP; });
}
