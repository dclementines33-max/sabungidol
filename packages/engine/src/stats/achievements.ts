// Achievements (PRD §7.4 + the four proposed badges; Perennial Podium = 100, user 2026-11-13). Worked out
// for each finished season from its places and the career stats before and after it. Milestones are
// given once per idol; season badges (title runs, Invincible, Grand Slam …) every season they happen.
import { competitionKeyOf } from "@sabung/shared";
import type { Placement } from "../season/placements";
import { PRESTIGE } from "../season/seasonClose";
import type { CareerLine, CareerState } from "./careerStats";

const MILESTONES: [string, (l: CareerLine, d1: CareerLine | undefined) => boolean][] = [
  ["century", (l) => l.wins >= 1000],
  ["half-century", (l) => l.wins >= 500],
  ["streak-master", (l) => l.bestWinStreak >= 10],
  ["elite-tactician", (l) => l.matches >= 200 && (l.wins + 0.5 * l.draws) / l.matches >= 0.7],
  ["perennial-podium", (l) => l.titles + l.runnerUp + l.third >= 100],
  ["point-machine", (l) => l.leaguePoints >= 5000],
  ["league-titan", (_, d1) => (d1?.titles ?? 0) >= 5],
  ["giant-killer", (l) => l.giantKills >= 10],
  ["comeback-queen", (l) => l.reverseSweeps >= 5],
];

export type AchievementState = { runs: Record<string, { last: number; run: number }>; division: Record<string, "D1" | "D2">; promotedIn: Record<string, number>; given: string[] };
export type Badge = { idolId: string; badge: string; season: number };
export const emptyAchievements = (): AchievementState => ({ runs: {}, division: {}, promotedIn: {}, given: [] });

export function seasonAchievements(previous: AchievementState, season: number, placements: Placement[], before: CareerState, after: CareerState, scores: Map<string, number>) {
  const state: AchievementState = structuredClone(previous);
  const given = new Set(state.given);
  const badges: Badge[] = [];
  const award = (idolId: string, badge: string) => badges.push({ idolId, badge, season });
  const titles = new Map<string, string[]>(); // idol → title keys won this season
  for (const p of placements) if (p.finalRank === 1) titles.set(p.idolId, [...(titles.get(p.idolId) ?? []), p.comp]);

  for (const p of placements) { // D2 → D1 moves, for Trainee to Star
    if (p.stageReached !== "LG" || !/^D[12]/.test(p.comp)) continue;
    const division = p.comp.slice(0, 2) as "D1" | "D2";
    if (state.division[p.idolId] === "D2" && division === "D1") state.promotedIn[p.idolId] ??= season;
    state.division[p.idolId] = division;
  }

  for (const [idol, keys] of titles) {
    for (const key of keys) { // the same competition won in a row
      const r = state.runs[`${idol}|${key}`];
      const run = r && r.last === season - 1 ? r.run + 1 : 1;
      state.runs[`${idol}|${key}`] = { last: season, run };
      if (run === 2) award(idol, "back-to-back");
      if (run === 3) award(idol, "hattrick");
      if (run >= 4) award(idol, "ultimate-bias");
    }
    const comps = new Set(keys.map((k) => competitionKeyOf(k.split("-")[0]!)));
    if (comps.has("D1") && comps.has("UZC") && comps.has("IDL")) award(idol, "grand-slam");
    if ([...comps].filter((c) => PRESTIGE[c] >= 0.7).length >= 2) award(idol, "dual-crown");
    if (!before[`${idol}|ALL`]) award(idol, "rookie-sensation"); // a title in the idol's first season
    const promoted = state.promotedIn[idol];
    if (comps.has("D1") && promoted !== undefined && season - promoted <= 2) { award(idol, "trainee-to-star"); delete state.promotedIn[idol]; }
  }

  for (const [key, line] of Object.entries(after)) {
    const [idol, comp] = key.split("|") as [string, string];
    if (comp !== "ALL") continue;
    if (line.invincibleSeasons > (before[key]?.invincibleSeasons ?? 0)) award(idol, "invincible");
    for (const [badge, reached] of MILESTONES) {
      if (!given.has(`${idol}|${badge}`) && reached(line, after[`${idol}|D1`])) { given.add(`${idol}|${badge}`); award(idol, badge); }
    }
  }

  const best = [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (best) award(best[0], "idol-of-season");
  state.given = [...given].sort();
  const unique = new Map(badges.map((b) => [`${b.idolId}|${b.badge}`, b])); // one per idol, badge and season
  return { state, badges: [...unique.values()] };
}
