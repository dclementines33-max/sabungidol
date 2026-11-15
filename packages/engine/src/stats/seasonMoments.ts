// Season moments (2026-11-16): big matches, shock cup exits, titles clinched early and champions crowned. Pure, from the
// season's matches in play order. `fresh` = ids of the matches just played (null = the whole season): a moment only
// counts when its match is fresh, so the Simulation Timeline shows what happened in one bulk play.
import { computeStandings } from "../standings";
import type { SimMatch, Title } from "../season/types";

export type MomentStory =
  | { kind: "big-match"; matchId: string; winner: string; loser: string; ratingWinner: number; ratingLoser: number; draw: boolean }
  | { kind: "shock-exit"; matchId: string; winner: string; loser: string; comp: string; round: string; gap: number }
  | { kind: "clinched"; idol: string; league: string; matchday: number; left: number }
  | { kind: "champion"; idol: string; title: string; runnerUp: string };

export type Moment<S = MomentStory> = { at: number; story: S }; // at = index in matches, for the timeline order

const BIG = 90; // both idols S tier or better
const STRONG = 88; // a cup exit is only a shock for a strong idol…
const SHOCK_GAP = 5; // …beaten by one this much lower
const EXIT_STAGES = new Set(["KO", "LB", "FN"]); // a loss here ends the idol's cup (UB losers drop to the LB)

const sides = (m: SimMatch) => (m.result === "B" ? [m.idolB, m.idolA, m.ratingB, m.ratingA] : [m.idolA, m.idolB, m.ratingA, m.ratingB]) as [string, string, number, number];
const md = (m: SimMatch) => Number(m.round.slice(2));
export const lastIndex = (list: SimMatch[], f: (m: SimMatch) => boolean) => Math.max(-1, ...list.flatMap((m, i) => (f(m) ? [i] : [])));

export function seasonMoments(matches: SimMatch[], fresh: Set<string> | null, titles: Partial<Record<string, Title>>, titlesBefore: Partial<Record<string, Title>> = {}): Moment[] {
  const isFresh = (m: SimMatch) => !fresh || fresh.has(m.id);
  const out: Moment[] = [];
  const indexed = matches.map((m, at) => ({ m, at })).filter(({ m }) => isFresh(m));

  const big = indexed.filter(({ m }) => Math.min(m.ratingA, m.ratingB) >= BIG)
    .sort((x, y) => Math.min(y.m.ratingA, y.m.ratingB) - Math.min(x.m.ratingA, x.m.ratingB) || x.at - y.at).slice(0, 3);
  for (const { m, at } of big) {
    const [winner, loser, ratingWinner, ratingLoser] = sides(m);
    out.push({ at, story: { kind: "big-match", matchId: m.id, winner, loser, ratingWinner, ratingLoser, draw: m.result === "D" } });
  }

  const shocks = indexed.filter(({ m }) => m.result !== "D" && EXIT_STAGES.has(m.stage) && m.round !== "3RD")
    .map(({ m, at }) => ({ at, m, s: sides(m) })).filter(({ s }) => s[3] >= STRONG && s[3] - s[2] >= SHOCK_GAP)
    .sort((x, y) => (y.s[3] - y.s[2]) - (x.s[3] - x.s[2]) || x.at - y.at).slice(0, 3);
  for (const { m, at, s } of shocks) out.push({ at, story: { kind: "shock-exit", matchId: m.id, winner: s[0], loser: s[1], comp: m.comp, round: m.round, gap: s[3] - s[2] } });

  const leagues = new Map<string, { m: SimMatch; at: number }[]>();
  matches.forEach((m, at) => { if (m.stage === "LG") leagues.set(m.comp, [...(leagues.get(m.comp) ?? []), { m, at }]); });
  for (const [league, list] of [...leagues].sort(([a], [b]) => a.localeCompare(b))) {
    const clinch = clinchOf(list.map((x) => x.m));
    if (!clinch) continue;
    const decider = list.find(({ m }) => md(m) === clinch.matchday && (m.idolA === clinch.idol || m.idolB === clinch.idol));
    if (decider && isFresh(decider.m)) out.push({ at: decider.at, story: { kind: "clinched", league, ...clinch } });
  }

  for (const [title, t] of Object.entries(titles).sort(([a], [b]) => a.localeCompare(b))) {
    if (!t || titlesBefore[title]) continue;
    const comp = title === "IDL-PO" ? "IDL" : title;
    const at = lastIndex(matches, (m) => m.comp === comp && (title !== "IDL-PO" || m.stage !== "LG"));
    out.push({ at: at + 0.5, story: { kind: "champion", idol: t.champion, title, runnerUp: t.runnerUp } }); // right after its last match
  }
  return out;
}

// The earliest matchday after which no one can catch the leader (points 3/1/0, double round robin), if before the last.
export function clinchOf(list: SimMatch[]): { idol: string; matchday: number; left: number } | null {
  const ids = [...new Set(list.flatMap((m) => [m.idolA, m.idolB]))];
  const perIdol = 2 * (ids.length - 1); // matches each idol plays
  const last = ids.length % 2 ? 2 * ids.length : perIdol;
  const played = Math.max(0, ...list.map(md));
  for (let day = 1; day <= Math.min(played, last - 1); day++) {
    const [top, ...rest] = computeStandings(ids.map((id) => ({ id, startRating: 0 })), list.filter((m) => md(m) <= day));
    if (top && rest.every((r) => top.points > r.points + 3 * (perIdol - r.played))) return { idol: top.idolId, matchday: day, left: last - day };
  }
  return null;
}
