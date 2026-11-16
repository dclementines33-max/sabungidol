// Title news (2026-11-16, user via router): how each title was won, for every format. Expectation: a champion rated far
// below the favourite (the field's highest pre-season rating) is an underdog story, a favourite who did not win is a flop.
// Leagues: the title-race margin (level on points = tiebreak, narrow, runaway). Knockouts: a final that went to the
// deciding game. Pure, from the season's matches and titles; thresholds are ours.
import { computeStandings } from "../standings";
import type { SimMatch, Title } from "../season/types";

export type TitleStory =
  | { kind: "underdog-champion"; idol: string; title: string; rating: number; favourite: string; favouriteRating: number; above: number }
  | { kind: "favourite-flop"; idol: string; title: string; rating: number; champion: string; rank: number | null; stage: string; round: string }
  | { kind: "title-race"; idol: string; runnerUp: string; title: string; margin: number; how: "level" | "narrow" | "runaway" }
  | { kind: "final-thriller"; idol: string; runnerUp: string; title: string; score: string };

const UNDERDOG_GAP = 5; // rating points below the favourite…
const UNDERDOG_ABOVE = 3; // …with at least this many idols rated above the champion
const NARROW = 2; // league points
const RUNAWAY = 10;
const MIN_FIELD = 4; // one-off finals (Daesang, Music Bank) have no favourite to speak of

// The matches a title was decided in: The Idols playoff is IDL outside the league stage, Music Bank finals are "MBK-<league>".
const fieldOf = (matches: SimMatch[], key: string) => {
  const [comp, part] = key.split("-");
  return matches.filter((m) => m.comp === comp && (key === "IDL-PO" ? m.stage !== "LG" : part ? m.round === part : true));
};

export function titleNews(matches: SimMatch[], titles: Partial<Record<string, Title>>): TitleStory[] {
  const out: TitleStory[] = [];
  for (const [title, t] of Object.entries(titles).sort(([a], [b]) => a.localeCompare(b))) {
    if (!t) continue;
    const field = fieldOf(matches, title);
    const rating = new Map<string, number>(); // pre-season = the rating in an idol's first match
    for (const m of field) { if (!rating.has(m.idolA)) rating.set(m.idolA, m.ratingA); if (!rating.has(m.idolB)) rating.set(m.idolB, m.ratingB); }
    if (rating.size < MIN_FIELD) continue;
    const league = field.every((m) => m.stage === "LG");
    const table = league ? computeStandings([...rating].map(([id, r]) => ({ id, startRating: r })), field) : [];

    const ranked = [...rating].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const [favourite, top] = ranked[0]!;
    const own = rating.get(t.champion)!;
    const above = ranked.filter(([, r]) => r > own).length;
    if (top - own >= UNDERDOG_GAP && above >= UNDERDOG_ABOVE) {
      out.push({ kind: "underdog-champion", idol: t.champion, title, rating: own, favourite, favouriteRating: top, above });
    } else if (favourite !== t.champion && ranked[1]![1] < top) { // a clear favourite only
      const last = field.filter((m) => m.idolA === favourite || m.idolB === favourite).at(-1)!;
      const rank = league ? table.findIndex((r) => r.idolId === favourite) + 1 : null;
      out.push({ kind: "favourite-flop", idol: favourite, title, rating: top, champion: t.champion, rank, stage: last.stage, round: last.round });
    }

    if (league && table[1]?.idolId === t.runnerUp && table[0]?.idolId === t.champion) {
      const margin = table[0].points - table[1].points;
      const how = margin === 0 ? "level" : margin <= NARROW ? "narrow" : margin >= RUNAWAY ? "runaway" : null;
      if (how) out.push({ kind: "title-race", idol: t.champion, runnerUp: t.runnerUp, title, margin, how });
    }
    const final = field.filter((m) => [m.idolA, m.idolB].sort().join("|") === [t.champion, t.runnerUp].sort().join("|")).at(-1);
    if (!league && final) {
      const [hi, lo] = [Math.max(final.scoreA, final.scoreB), Math.min(final.scoreA, final.scoreB)];
      if (lo >= 1 && hi - lo === 1) out.push({ kind: "final-thriller", idol: t.champion, runnerUp: t.runnerUp, title, score: `${hi}–${lo}` });
    }
  }
  return out;
}
