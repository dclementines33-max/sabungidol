// The Simulation Timeline (2026-11-16 revamp): what one bulk play changed, per competition track — each league, the
// Unzure road (Swiss → LCQ → Unzure Cup), The Idols (league + playoff), every other cup — as labelled points (one per
// round with something worth telling) and a finale. Only the competitions just played appear; no cap, no filler: a
// round with nothing interesting has no point. A whole-season play gets one combined timeline of the biggest moments.
import type { SeasonResult, SimMatch, Title } from "../season/types";
import { STRONG, cupTimeline } from "./cupTimeline";
import { type Indexed, leagueTimeline, ratingsOf } from "./leagueTimeline";
import type { AnyStory } from "./newsScore";

export type TrackStory =
  | { kind: "rivalry-result"; matchId: string; winner: string; loser: string; draw: boolean }
  | { kind: "new-leader"; idol: string; league: string; matchday: number; previous: string }
  | { kind: "leader-run"; idol: string; league: string; since: number; matchdays: number }
  | { kind: "zone"; idol: string; league: string; matchday: number; zone: "promotion" | "relegation" | "bottom"; entered: boolean }
  | { kind: "top-miss"; idol: string; league: string; rank: number; rating: number }
  | { kind: "failed"; idol: string; rating: number; comp: string; stage: "swiss" | "lcq" | "groups" | "unzure" }
  | { kind: "escape"; idol: string; comp: string; how: "decider" | "last-matchday" | "tiebreak" }
  | { kind: "qualified"; comp: string; idols: string[] }
  | { kind: "giant-killer"; idol: string; comp: string; wins: number }
  | { kind: "final"; matchId: string; winner: string; loser: string; score: string; comp: string };
export type TimelineStory = AnyStory | TrackStory;

export type Event = { at: number; comp: string; stage: string; round: string; story: TimelineStory };
export type Finale = {
  champions: { title: string; idol: string; runnerUp: string }[];
  promoted: string[]; relegated: string[]; qualified: string[];
  path: { matchId: string; round: string; opponent: string; won: boolean; score: string }[]; // the champion's road
  lines: TimelineStory[]; // "story of the season"
};
export type TimelinePoint = { comp: string; stage: string; round: string; stories: TimelineStory[] };
export type Timeline = { track: string | null; points: TimelinePoint[]; finale: Finale | null }; // track null = whole season

type State = { matches: SimMatch[]; titles: Partial<Record<string, Title>>; draws?: SeasonResult["draws"] };
export type TimelineOptions = { season?: boolean; rivals?: Set<string> }; // rivals: "a|b" (sorted) of the H2H top ten

export const trackOf = (comp: string) => (comp === "SWS" || comp === "LCQ" ? "UZC" : comp);
const SEASON_UPSET = 20; // in the whole-season view only the very biggest upsets
const SEASON_KINDS = new Set(["clinched", "failed", "shock-exit", "giant-killer", "upset", "top-miss"]);
const UPSET_CUPS = /^(BS|NUG)/; // B-Side and Nugu are built for upsets: there they are routine, not season news

export function simHighlights(before: State, after: State, opts: TimelineOptions = {}): Timeline[] {
  const known = new Set(before.matches.map((m) => m.id));
  const rivals = opts.rivals ?? new Set<string>();
  const byComp = new Map<string, Indexed[]>();
  after.matches.forEach((m, at) => byComp.set(m.comp, [...(byComp.get(m.comp) ?? []), { m, at, fresh: !known.has(m.id) }]));
  const played = [...byComp].filter(([, list]) => list.some((x) => x.fresh));
  if (!played.length) return [];

  const tracks = new Map<string, Map<string, Indexed[]>>();
  for (const [comp, list] of played) tracks.set(trackOf(comp), (tracks.get(trackOf(comp)) ?? new Map()).set(comp, list));
  const timelines = [...tracks].map(([track, comps]) => {
    const lg = comps.get(track)?.some((x) => x.m.stage === "LG") ? leagueTimeline(track, comps.get(track)!, rivals) : null;
    const cups = new Map([...comps].map(([c, l]) => [c, l.filter((x) => x.m.stage !== "LG")]).filter(([, l]) => l.length) as [string, Indexed[]][]);
    const cup = cups.size ? cupTimeline(cups, after.titles, before.titles, rivals) : null;
    const events = [...(lg?.events ?? []), ...(cup?.events ?? [])];
    return { track, events, finale: cup?.finale ?? lg?.finale ?? null, first: Math.min(...[...comps.values()].flat().filter((x) => x.fresh).map((x) => x.at)) };
  }).filter((t) => t.events.length || t.finale).sort((a, b) => a.first - b.first);

  if (!opts.season) return timelines.map((t) => ({ track: t.track, points: points(t.events), finale: t.finale }));

  // Whole season: the big moments of every track, strong idols who never reached the Unzure Cup, and one finale.
  const events = timelines.flatMap((t) => t.events).filter((e) => SEASON_KINDS.has(e.story.kind) && (e.story.kind !== "upset" || e.story.gap >= SEASON_UPSET)
    && !(UPSET_CUPS.test(e.comp) && ["shock-exit", "giant-killer", "upset"].includes(e.story.kind)));
  const pots = new Set(after.draws?.pots?.flat() ?? []);
  if (pots.size && !before.draws?.pots) {
    const failed = new Set(events.flatMap((e) => (e.story.kind === "failed" ? [e.story.idol] : [])));
    const d1 = played.filter(([comp]) => /^D1[A-F]$/.test(comp)).flatMap(([, list]) => list.map((x) => x.m));
    const at = Math.max(...(byComp.get("SWS") ?? byComp.get("UZC") ?? []).map((x) => x.at), 0);
    for (const [id, r] of ratingsOf(d1)) if (r >= STRONG && !pots.has(id) && !failed.has(id)) events.push({ at, comp: "UZC", stage: "GS", round: "DRAW", story: { kind: "failed", idol: id, rating: r, comp: "UZC", stage: "unzure" } });
  }
  const finales = timelines.flatMap((t) => (t.finale ? [t.finale] : []));
  const finale: Finale | null = finales.length ? {
    champions: finales.flatMap((f) => f.champions), promoted: finales.flatMap((f) => f.promoted), relegated: finales.flatMap((f) => f.relegated),
    qualified: [], path: [], lines: finales.flatMap((f) => f.lines).slice(0, 2),
  } : null;
  return events.length || finale ? [{ track: null, points: points(events), finale }] : [];
}

// Events grouped into one point per competition round, in play order.
function points(events: Event[]): TimelinePoint[] {
  const by = new Map<string, { at: number; point: TimelinePoint }>();
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    const round = e.round.replace(/^[A-P]-/, ""); // every group's round 3 is one point: "Groups MD3", "Swiss R3"
    const key = `${e.comp}|${e.stage}|${round}`;
    const p = by.get(key) ?? { at: e.at, point: { comp: e.comp, stage: e.stage, round, stories: [] } };
    p.point.stories.push(e.story);
    by.set(key, p);
  }
  return [...by.values()].sort((a, b) => a.at - b.at).map((p) => p.point);
}
