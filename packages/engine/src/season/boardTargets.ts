// Board season targets (2026-11-17, user via router): before the season every league idol gets a target from her rating
// rank inside her league (the expectation a board would set), and the finished league grades it. D1: #1 title, #2–4 top
// 4, #5–10 top half, the rest avoid relegation. D2: #1 title, #2–3 promotion, #4–10 top half, the rest stay off the bottom
// 5. Grade: exceeded = reached the next tighter target, met, missed = within the next looser one, failed = worse. Pure.
import { computeStandings } from "../standings";
import type { SimMatch } from "./types";

export type TargetKind = "title" | "top-4" | "promotion" | "top-half" | "survive" | "avoid-bottom";
export type Grade = "exceeded" | "met" | "missed" | "failed";
export type BoardTarget = { idolId: string; league: string; kind: TargetKind; place: number; rank: number | null; grade: Grade | null };

// Each tier: the target, the finish it asks for, and the rating ranks it is given to (up to and including).
function tiers(league: string, n: number): [TargetKind, number, number][] {
  const half = Math.floor(n / 2);
  return league.startsWith("D1")
    ? [["title", 1, 1], ["top-4", 4, 4], ["top-half", half, half], ["survive", n - 3, n]]
    : [["title", 1, 1], ["promotion", 3, 3], ["top-half", half, half], ["avoid-bottom", n - 5, n]];
}

export function boardTargets(matches: SimMatch[]): BoardTarget[] {
  const leagues = new Map<string, SimMatch[]>();
  for (const m of matches) if (m.stage === "LG" && /^D[12]/.test(m.comp)) leagues.set(m.comp, [...(leagues.get(m.comp) ?? []), m]);
  const out: BoardTarget[] = [];
  for (const [league, list] of [...leagues].sort(([a], [b]) => a.localeCompare(b))) {
    const rating = new Map<string, number>(); // pre-season = the rating in an idol's first match
    for (const m of list) { if (!rating.has(m.idolA)) rating.set(m.idolA, m.ratingA); if (!rating.has(m.idolB)) rating.set(m.idolB, m.ratingB); }
    const n = rating.size;
    const finished = list.length === n * (n - 1); // double round robin complete
    const table = finished ? computeStandings([...rating].map(([id, r]) => ({ id, startRating: r })), list).map((r) => r.idolId) : [];
    const levels = tiers(league, n);
    [...rating].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([idolId], i) => {
      const t = levels.findIndex(([, , upTo]) => i + 1 <= upTo);
      const [kind, place] = levels[t]!;
      const rank = finished ? table.indexOf(idolId) + 1 : null;
      const grade: Grade | null = rank === null ? null : t > 0 && rank <= levels[t - 1]![1] ? "exceeded" : rank <= place ? "met" : levels[t + 1] && rank <= levels[t + 1]![1] ? "missed" : "failed";
      out.push({ idolId, league, kind, place, rank, grade });
    });
  }
  return out;
}
