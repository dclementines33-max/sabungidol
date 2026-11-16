// Simulation Timeline, one league (2026-11-16 revamp): what changed in the matchdays just played — a new leader, a long
// lead, idols moving into or out of the zones, big upsets, heated-rivalry results, a strong idol outside the top 6, a
// title clinched early — and, when the league ends, the finale (champion, promoted, relegated). Pure; thresholds are ours.
import { computeStandings } from "../standings";
import type { SimMatch } from "../season/types";
import { clinchOf } from "./seasonMoments";
import type { Event, Finale, TimelineStory } from "./simHighlights";

export const UPSET_GAP = 12; // rating points between winner and loser for "a big upset"
const LEADER_FROM = 4; // early leads swap all the time: a new leader only counts from this matchday
const ZONE_FROM = 8; // likewise for the zones
const RUN = 5; // a lead is news once it lasts this many matchdays
const STREAK = 7;

const md = (m: SimMatch) => Number(m.round.slice(2));
export const ratingsOf = (list: SimMatch[]) => {
  const r = new Map<string, number>();
  for (const m of list) r.set(m.idolA, m.ratingA).set(m.idolB, m.ratingB);
  return r;
};
export const pairKey = (a: string, b: string) => [a, b].sort().join("|");

// Matches of one competition in play order with their index in the season (at); fresh = played just now.
export type Indexed = { m: SimMatch; at: number; fresh: boolean };

// Fresh rivalry results, big upsets and win streaks inside one competition: shared by leagues and cups.
export function matchEvents(list: Indexed[], comp: string, rivals: Set<string>, upsetGap = UPSET_GAP): Event[] {
  const out: Event[] = [];
  const run = new Map<string, number>();
  const peak = new Map<string, Event>();
  const upsets = new Map<string, Event>(); // one per beaten idol (the biggest): a star losing every week is one story
  for (const { m, at, fresh } of list) {
    const ev = (story: TimelineStory): Event => ({ at, comp, stage: m.stage, round: m.round, story });
    const [winner, loser, rw, rl] = m.result === "B" ? [m.idolB, m.idolA, m.ratingB, m.ratingA] : [m.idolA, m.idolB, m.ratingA, m.ratingB];
    // A heated rivalry is news when the favourite slips (a draw, or the lower-rated idol wins).
    if (fresh && rivals.has(pairKey(m.idolA, m.idolB)) && (m.result === "D" || rw < rl)) out.push(ev({ kind: "rivalry-result", matchId: m.id, winner, loser, draw: m.result === "D" }));
    else if (fresh && m.result !== "D" && rl - rw >= upsetGap && rl - rw > ((upsets.get(loser)?.story as { gap?: number })?.gap ?? 0)) upsets.set(loser, ev({ kind: "upset", matchId: m.id, winner, loser, gap: rl - rw }));
    for (const idol of [m.idolA, m.idolB]) {
      const n = m.result !== "D" && idol === winner ? (run.get(idol) ?? 0) + 1 : 0;
      run.set(idol, n);
      if (fresh && n >= STREAK && (n === STREAK || n % 5 === 0)) peak.set(idol, ev({ kind: "streak", matchId: m.id, idol, wins: n }));
    }
  }
  return [...out, ...upsets.values(), ...peak.values()];
}

export function leagueTimeline(comp: string, list: Indexed[], rivals: Set<string>): { events: Event[]; finale: Finale | null } {
  const lg = list.filter((x) => x.m.stage === "LG");
  const freshDays = [...new Set(lg.filter((x) => x.fresh).map((x) => md(x.m)))].sort((a, b) => a - b);
  if (!freshDays.length) return { events: [], finale: null };
  const rating = ratingsOf(lg.map((x) => x.m));
  const ids = [...rating.keys()];
  const total = ids.length % 2 ? 2 * ids.length : 2 * (ids.length - 1);
  const last = freshDays.at(-1)!;
  const tables = Array.from({ length: last + 1 }, (_, day) => computeStandings(ids.map((id) => ({ id, startRating: rating.get(id)! })), lg.filter((x) => md(x.m) <= day).map((x) => x.m)).map((r) => r.idolId));
  const at = (day: number) => Math.max(...lg.filter((x) => md(x.m) === day).map((x) => x.at)) + 0.1; // after that matchday's matches
  const events: Event[] = matchEvents(lg, comp, rivals);
  const ev = (day: number, story: TimelineStory): Event => ({ at: at(day), comp, stage: "LG", round: `MD${String(day).padStart(2, "0")}`, story });

  // Leaders: a takeover from LEADER_FROM on; a long lead at the end of this play.
  const holds = (day: number) => day === last || tables[day + 1]![0] === tables[day]![0]; // a one-matchday lead that flips straight back is no takeover
  for (const day of freshDays) if (day >= LEADER_FROM && day > 1 && tables[day]![0] !== tables[day - 1]![0] && holds(day)) events.push(ev(day, { kind: "new-leader", idol: tables[day]![0]!, league: comp, matchday: day, previous: tables[day - 1]![0]! }));
  const leader = tables[last]![0]!;
  let since = last;
  while (since > 1 && tables[since - 1]![0] === leader) since--;
  const run = last - since + 1;
  if (run >= RUN && (freshDays.length >= RUN || run % 5 === 0 || last === total)) events.push(ev(last, { kind: "leader-run", idol: leader, league: comp, since, matchdays: run }));

  // Zones (not in The Idols): D1 bottom 3 go down, D2 top 3 go up, and last place in both. An idol who moved in or out
  // and stayed there until the end of this play.
  const zones: [string, (rank: number) => boolean][] = comp === "IDL" ? [] : [
    [comp.startsWith("D1") ? "relegation" : "promotion", comp.startsWith("D1") ? (r) => r >= ids.length - 2 : (r) => r <= 3],
    ["bottom", (r) => r === ids.length],
  ];
  for (const [zone, inZone] of zones) {
    const member = (day: number, id: string) => inZone(tables[day]!.indexOf(id) + 1);
    for (const id of ids) {
      const day = freshDays.find((d) => d >= ZONE_FROM && member(d, id) !== member(d - 1, id) && freshDays.filter((x) => x >= d).every((x) => member(x, id) === member(d, id)));
      if (day) events.push(ev(day, { kind: "zone", idol: id, league: comp, matchday: day, zone: zone as "relegation" | "promotion" | "bottom", entered: member(day, id) }));
    }
  }

  // A strong idol (top 3 rating of the league) outside the top 6 after this play.
  if (last >= ZONE_FROM) {
    for (const id of [...ids].sort((a, b) => rating.get(b)! - rating.get(a)!).slice(0, 3)) {
      const rank = tables[last]!.indexOf(id) + 1;
      if (rank > 6) events.push(ev(last, { kind: "top-miss", idol: id, league: comp, rank, rating: rating.get(id)! }));
    }
  }

  const clinch = clinchOf(lg.map((x) => x.m));
  if (clinch && freshDays.includes(clinch.matchday)) events.push(ev(clinch.matchday, { kind: "clinched", league: comp, ...clinch }));

  if (last !== total) return { events, finale: null };
  const final = tables[last]!;
  return {
    events,
    finale: {
      champions: [{ title: comp, idol: final[0]!, runnerUp: final[1]! }],
      promoted: comp.startsWith("D2") ? final.slice(0, 3) : [],
      relegated: comp.startsWith("D1") ? final.slice(-3) : [],
      qualified: [], path: [],
      lines: run >= Math.floor(total * 0.75) ? [{ kind: "leader-run", idol: leader, league: comp, since, matchdays: run }] : [],
    },
  };
}
