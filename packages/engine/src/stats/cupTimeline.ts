// Simulation Timeline, one cup (2026-11-16 revamp). Swiss: strong idols knocked out, deciders survived, who went
// through. Round-robin groups (LCQ top 4 of 6, Unzure groups top 2 of 4): big names out, narrow escapes (in on the last
// matchday or only on a tiebreak). Knockout: shock exits, giant-killers, the final, and the champion's path. Pure.
import { computeStandings } from "../standings";
import type { SimMatch, Title } from "../season/types";
import { type Indexed, matchEvents, ratingsOf } from "./leagueTimeline";
import type { Event, Finale, TimelineStory } from "./simHighlights";

export const STRONG = 90; // "a big name": tier S or better
const KO_UPSET = 5; // a knockout win over an idol this much higher is a giant-killing
const KO_STAGES = new Set(["KO", "UB", "LB", "FN"]);
const ADVANCE: Record<string, number> = { LQ: 4, GS: 2 };

const side = (m: SimMatch) => (m.result === "B" ? [m.idolB, m.idolA, m.ratingB, m.ratingA] : [m.idolA, m.idolB, m.ratingA, m.ratingB]) as [string, string, number, number];
const ev = (x: Indexed, comp: string, story: TimelineStory): Event => ({ at: x.at, comp, stage: x.m.stage, round: x.m.round, story });

// Swiss (3 wins through, 3 losses out; 3–2 goes on to the LCQ).
function swiss(list: Indexed[], comp: string): Event[] {
  const rec = new Map<string, { w: number; l: number }>();
  const out: Event[] = [];
  const through: string[] = [];
  for (const x of list) {
    const [w, l, rw, rl] = side(x.m);
    const before = { w: rec.get(w) ?? { w: 0, l: 0 }, l: rec.get(l) ?? { w: 0, l: 0 } };
    rec.set(w, { ...before.w, w: before.w.w + 1 }).set(l, { ...before.l, l: before.l.l + 1 });
    if (!x.fresh) continue;
    if (before.l.l === 2 && rl >= STRONG) out.push(ev(x, comp, { kind: "failed", idol: l, rating: rl, comp, stage: "swiss" }));
    if (before.w.w === 2 && before.w.l === 2 && rw >= STRONG) out.push(ev(x, comp, { kind: "escape", idol: w, comp, how: "decider" }));
    if (before.w.w === 2 && before.w.l < 2) through.push(w);
  }
  const lastFresh = list.filter((x) => x.fresh).at(-1);
  if (lastFresh && through.length) out.push(ev(lastFresh, comp, { kind: "qualified", comp, idols: through }));
  return out;
}

// Round-robin groups (round "A-MD3"): once a group is complete in this play, who went out and who only just got through.
function groups(list: Indexed[], comp: string, stage: string): Event[] {
  const out: Event[] = [];
  const cut = ADVANCE[stage] ?? 2;
  const byGroup = new Map<string, Indexed[]>();
  for (const x of list) byGroup.set(x.m.round.split("-")[0]!, [...(byGroup.get(x.m.round.split("-")[0]!) ?? []), x]);
  for (const games of byGroup.values()) {
    const rating = ratingsOf(games.map((x) => x.m));
    const ids = [...rating.keys()];
    const day = (x: Indexed) => Number(x.m.round.split("MD")[1]);
    const last = Math.max(...games.map(day));
    if (games.filter((x) => day(x) === last).length < Math.floor(ids.length / 2) || !games.some((x) => x.fresh && day(x) === last)) continue; // not finished in this play
    const table = (upTo: number) => computeStandings(ids.map((id) => ({ id, startRating: rating.get(id)! })), games.filter((x) => day(x) <= upTo).map((x) => x.m));
    const final = table(last);
    const before = table(last - 1).map((r) => r.idolId);
    const end = games.at(-1)!;
    final.slice(cut).forEach((r) => { if (rating.get(r.idolId)! >= STRONG) out.push(ev(end, comp, { kind: "failed", idol: r.idolId, rating: rating.get(r.idolId)!, comp, stage: stage === "LQ" ? "lcq" : "groups" })); });
    final.slice(0, cut).forEach((r) => {
      if (before.indexOf(r.idolId) >= cut) out.push(ev(end, comp, { kind: "escape", idol: r.idolId, comp, how: "last-matchday" }));
      else if (final[cut] && final[cut]!.points === r.points) out.push(ev(end, comp, { kind: "escape", idol: r.idolId, comp, how: "tiebreak" }));
    });
  }
  return out;
}

// Knockout: shock exits and giant-killers as they happen, the final, and — once there is a champion — the finale.
function knockout(list: Indexed[], comp: string, title: Title | undefined, isNew: boolean): { events: Event[]; finale: Finale | null } {
  const out: Event[] = [];
  const kills = new Map<string, number>();
  for (const x of list) {
    const [w, l, rw, rl] = side(x.m);
    if (rl - rw >= KO_UPSET) kills.set(w, (kills.get(w) ?? 0) + 1);
    if (!x.fresh) continue;
    const final = x.m.round === "F" || x.m.round === "GF" || x.m.stage === "FN";
    if (final) out.push(ev(x, comp, { kind: "final", matchId: x.m.id, winner: w, loser: l, score: `${Math.max(x.m.scoreA, x.m.scoreB)}–${Math.min(x.m.scoreA, x.m.scoreB)}`, comp }));
    else if (rl >= STRONG - 2 && rl - rw >= KO_UPSET && x.m.stage !== "UB") out.push(ev(x, comp, { kind: "shock-exit", matchId: x.m.id, winner: w, loser: l, comp, round: x.m.round, gap: rl - rw }));
    if (rl - rw >= KO_UPSET && kills.get(w) === 2) out.push(ev(x, comp, { kind: "giant-killer", idol: w, comp, wins: 2 }));
  }
  if (!title || !isNew) return { events: out, finale: null };
  const path = list.filter((x) => x.m.idolA === title.champion || x.m.idolB === title.champion).map((x) => {
    const [w, l] = side(x.m);
    return { matchId: x.m.id, round: x.m.round, opponent: w === title.champion ? l : w, won: w === title.champion, score: `${x.m.idolA === title.champion ? x.m.scoreA : x.m.scoreB}–${x.m.idolA === title.champion ? x.m.scoreB : x.m.scoreA}` };
  });
  return { events: out, finale: { champions: [{ title: comp, idol: title.champion, runnerUp: title.runnerUp }], promoted: [], relegated: [], qualified: [], path, lines: [] } };
}

// One cup track (several competitions for the Unzure road: SWS, LCQ, UZC).
export function cupTimeline(comps: Map<string, Indexed[]>, titles: Partial<Record<string, Title>>, titlesBefore: Partial<Record<string, Title>>, rivals: Set<string>): { events: Event[]; finale: Finale | null } {
  const events: Event[] = [];
  let finale: Finale | null = null;
  for (const [comp, list] of comps) {
    const ko = list.filter((x) => KO_STAGES.has(x.m.stage));
    events.push(...matchEvents(list.filter((x) => !KO_STAGES.has(x.m.stage)), comp, rivals));
    events.push(...swiss(list.filter((x) => x.m.stage === "SW"), comp));
    for (const stage of ["LQ", "GS"]) events.push(...groups(list.filter((x) => x.m.stage === stage), comp, stage));
    if (ko.length) {
      const key = comp === "IDL" ? "IDL-PO" : comp;
      const k = knockout(ko, comp, titles[key], !!titles[key] && !titlesBefore[key]);
      events.push(...k.events);
      finale ??= k.finale;
    }
  }
  return { events, finale };
}
