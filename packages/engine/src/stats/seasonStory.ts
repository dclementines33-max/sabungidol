// Season Story (PRD §8): the season's news, picked from its matches and titles. The screen writes the headline
// from a template per kind ("{A} menumbangkan {B} meski selisih rating {d}"); each story points at its match.
import { isReverseSweep } from "./careerStats";
import type { SimMatch, Title } from "../season/types";

export type Story =
  | { kind: "upset"; matchId: string; winner: string; loser: string; gap: number }
  | { kind: "reverse-sweep"; matchId: string; winner: string; loser: string }
  | { kind: "streak"; matchId: string; idol: string; wins: number }
  | { kind: "first-title"; idol: string; title: string; runnerUp: string }
  | { kind: "idol-of-month"; idol: string; from: number; to: number; wins: number };

const winnerOf = (m: SimMatch) => (m.result === "A" ? [m.idolA, m.idolB, m.ratingA, m.ratingB] : [m.idolB, m.idolA, m.ratingB, m.ratingA]) as [string, string, number, number];

// earlierTitles: `${idolId}|${titleKey}` for every title won in an earlier season.
export function seasonStory(matches: SimMatch[], titles: Partial<Record<string, Title>>, earlierTitles: Set<string>): Story[] {
  const decided = matches.filter((m) => m.result !== "D");
  const upsets = decided.map((m) => ({ m, w: winnerOf(m) })).filter(({ w }) => w[3] > w[2]).sort((x, y) => (y.w[3] - y.w[2]) - (x.w[3] - x.w[2]) || x.m.id.localeCompare(y.m.id)).slice(0, 5)
    .map(({ m, w }): Story => ({ kind: "upset", matchId: m.id, winner: w[0], loser: w[1], gap: w[3] - w[2] }));
  const sweeps = decided.filter(isReverseSweep).slice(0, 5).map((m): Story => ({ kind: "reverse-sweep", matchId: m.id, winner: winnerOf(m)[0], loser: winnerOf(m)[1] }));

  const run = new Map<string, number>();
  const best = new Map<string, { wins: number; matchId: string }>(); // each idol's longest run this season, and the match that reached it
  for (const m of matches) {
    for (const idol of [m.idolA, m.idolB]) {
      const won = m.result !== "D" && winnerOf(m)[0] === idol;
      const n = won ? (run.get(idol) ?? 0) + 1 : 0;
      run.set(idol, n);
      if (n > (best.get(idol)?.wins ?? 0)) best.set(idol, { wins: n, matchId: m.id });
    }
  }
  const streaks = [...best].sort((a, b) => b[1].wins - a[1].wins || a[0].localeCompare(b[0])).slice(0, 3)
    .map(([idol, s]): Story => ({ kind: "streak", matchId: s.matchId, idol, wins: s.wins }));

  const firsts = Object.entries(titles).filter(([key, t]) => t && !earlierTitles.has(`${t.champion}|${key}`)).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, t]): Story => ({ kind: "first-title", idol: t!.champion, title: key, runnerUp: t!.runnerUp }));

  const months: Story[] = [];
  for (const [from, to] of [[1, 10], [11, 20], [21, 30], [31, 38]] as const) {
    const wins = new Map<string, number>();
    for (const m of decided) {
      const md = Number(m.round.slice(2));
      if (m.stage === "LG" && md >= from && md <= to) wins.set(winnerOf(m)[0], (wins.get(winnerOf(m)[0]) ?? 0) + 1);
    }
    const top = [...wins].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (top) months.push({ kind: "idol-of-month", idol: top[0], from, to, wins: top[1] });
  }
  return [...firsts, ...upsets, ...sweeps, ...streaks, ...months];
}
