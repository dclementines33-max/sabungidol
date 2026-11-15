// The Simulation Timeline (2026-11-16): the highlights of one bulk play, in the order they happened. Moments plus the
// Season Story kinds that fit one batch — upsets, comebacks, win streaks, records — limited to the matches just played.
import { isReverseSweep } from "./careerStats";
import { type AnyStory, newsScore } from "./newsScore";
import { seasonDrama } from "./seasonDrama";
import { seasonNews } from "./seasonNews";
import { lastIndex, type Moment, seasonMoments } from "./seasonMoments";
import type { SimMatch, Title } from "../season/types";

const UPSET_GAP = 10;
const STREAK = 7;
const MAX = 24;

export type Highlight = Moment<AnyStory>;

// before = the season replayed before this play; after = once it ended. previousBest/earlierTitles as in Season Story.
export function simHighlights(
  before: { matches: SimMatch[]; titles: Partial<Record<string, Title>> },
  after: { matches: SimMatch[]; titles: Partial<Record<string, Title>> },
  previousBest: number | null = null, earlierTitles = new Map<string, number>(),
): Highlight[] {
  const known = new Set(before.matches.map((m) => m.id));
  const matches = after.matches;
  const fresh = new Set(matches.filter((m) => !known.has(m.id)).map((m) => m.id));
  if (!fresh.size) return [];
  const out: Highlight[] = seasonMoments(matches, fresh, after.titles, before.titles);
  const at = new Map(matches.map((m, i) => [m.id, i]));

  const run = new Map<string, number>();
  const peak = new Map<string, { wins: number; matchId: string }>(); // the longest run reached inside this play
  matches.forEach((m, i) => {
    const winner = m.result === "A" ? m.idolA : m.result === "B" ? m.idolB : null;
    const loser = m.result === "A" ? m.idolB : m.result === "B" ? m.idolA : null;
    if (fresh.has(m.id) && winner && loser) {
      const [rw, rl] = winner === m.idolA ? [m.ratingA, m.ratingB] : [m.ratingB, m.ratingA];
      if (rl - rw >= UPSET_GAP) out.push({ at: i, story: { kind: "upset", matchId: m.id, winner, loser, gap: rl - rw } });
      if (isReverseSweep(m)) out.push({ at: i, story: { kind: "reverse-sweep", matchId: m.id, winner, loser } });
    }
    for (const idol of [m.idolA, m.idolB]) {
      const n = idol === winner ? (run.get(idol) ?? 0) + 1 : 0;
      run.set(idol, n);
      if (fresh.has(m.id) && n >= STREAK && n > (peak.get(idol)?.wins ?? 0)) peak.set(idol, { wins: n, matchId: m.id });
    }
  });
  for (const [idol, p] of peak) out.push({ at: at.get(p.matchId)!, story: { kind: "streak", matchId: p.matchId, idol, wins: p.wins } });

  // Records that only exist once a league ends: kept when its last matchday was in this play.
  const endsAt = (league: string) => lastIndex(matches, (m) => m.comp === league && m.stage === "LG" && m.round === "MD38");
  const ended = (league: string) => fresh.has(matches[endsAt(league)]?.id ?? "");
  for (const s of seasonDrama(matches, previousBest)) if (s.kind === "points-record" && ended(s.league)) out.push({ at: endsAt(s.league) + 0.4, story: s });
  const newTitles = new Set(Object.entries(after.titles).filter(([k, t]) => t && !before.titles[k]).map(([, t]) => t!.champion));
  for (const s of seasonNews(matches, after.titles, earlierTitles)) {
    if (s.kind === "unbeaten" && ended(s.league)) out.push({ at: endsAt(s.league) + 0.4, story: s });
    if (s.kind === "title-milestone" && newTitles.has(s.idol)) out.push({ at: matches.length, story: s });
  }

  // Too many for one popup: keep the biggest, then put them back in play order.
  return out.map((h, i) => ({ h, i, score: newsScore(h.story) })).sort((a, b) => b.score - a.score || a.i - b.i).slice(0, MAX)
    .map(({ h }) => h).sort((a, b) => a.at - b.at);
}
