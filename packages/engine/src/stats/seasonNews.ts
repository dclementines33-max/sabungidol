// More Season Story kinds (2026-11-15): the season's biggest rivalry, double/treble titles, a career title milestone,
// a strong idol's losing run, and an unbeaten league season. Pure, from the season's matches (in play order) and titles.
// 2026-11-17: revenge (league leg 2 comeback), domination (league sweep), de-revenge (bracket comeback), heated-rivalry (top-tier cross-tournament).
import { prestigeOf } from "../season/expectation";
import type { SimMatch, Title } from "../season/types";

export type NewsStory =
  | { kind: "rivalry"; a: string; b: string; meetings: number; winsA: number; winsB: number }
  | { kind: "multi-title"; idol: string; titles: string[] }
  | { kind: "title-milestone"; idol: string; total: number }
  | { kind: "slump"; matchId: string; idol: string; losses: number; rating: number }
  | { kind: "unbeaten"; idol: string; league: string; wins: number; draws: number }
  | { kind: "revenge"; idol: string; foe: string; comp: string }
  | { kind: "domination"; idol: string; foe: string; comp: string }
  | { kind: "de-revenge"; idol: string; foe: string; comp: string }
  | { kind: "heated-rivalry"; a: string; b: string; meetings: number; winsA: number; winsB: number };

const MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
const MIN_MEETINGS = 3;
const STRONG = 85; // a losing run is only news for a strong idol
const MIN_SLUMP = 4;

const loserOf = (m: SimMatch) => (m.result === "A" ? m.idolB : m.result === "B" ? m.idolA : null);

// earlierTitles: titles each idol won in earlier seasons.
export function seasonNews(matches: SimMatch[], titles: Partial<Record<string, Title>>, earlierTitles: Map<string, number>): NewsStory[] {
  const out: NewsStory[] = [];

  const pairs = new Map<string, SimMatch[]>();
  for (const m of matches) {
    const key = [m.idolA, m.idolB].sort().join("|");
    pairs.set(key, [...(pairs.get(key) ?? []), m]);
  }
  const rival = [...pairs].filter(([, l]) => l.length >= MIN_MEETINGS).sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0]))[0];
  if (rival) {
    const [a, b] = rival[0].split("|") as [string, string];
    const wins = (id: string) => rival[1].filter((m) => m.result !== "D" && loserOf(m) !== id).length;
    out.push({ kind: "rivalry", a, b, meetings: rival[1].length, winsA: wins(a), winsB: wins(b) });
  }

  const won = new Map<string, string[]>();
  for (const [key, t] of Object.entries(titles).sort(([x], [y]) => x.localeCompare(y))) if (t) won.set(t.champion, [...(won.get(t.champion) ?? []), key]);
  for (const [idol, list] of won) {
    if (list.length >= 2) out.push({ kind: "multi-title", idol, titles: list });
    const before = earlierTitles.get(idol) ?? 0;
    const reached = MILESTONES.filter((n) => n > before && n <= before + list.length).at(-1);
    if (reached) out.push({ kind: "title-milestone", idol, total: reached });
  }

  const run = new Map<string, number>();
  let slump: NewsStory | null = null;
  for (const m of matches) {
    for (const [idol, rating] of [[m.idolA, m.ratingA], [m.idolB, m.ratingB]] as const) {
      const n = loserOf(m) === idol ? (run.get(idol) ?? 0) + 1 : 0;
      run.set(idol, n);
      if (rating >= STRONG && n >= MIN_SLUMP && (!slump || n > (slump as { losses: number }).losses)) slump = { kind: "slump", matchId: m.id, idol, losses: n, rating };
    }
  }
  if (slump) out.push(slump);

  const leagues = new Map<string, SimMatch[]>();
  for (const m of matches) if (m.stage === "LG" && m.comp !== "IDL") leagues.set(m.comp, [...(leagues.get(m.comp) ?? []), m]);
  for (const [league, list] of [...leagues].sort(([x], [y]) => x.localeCompare(y))) {
    if (!list.some((m) => m.round === "MD38")) continue; // only finished leagues
    for (const idol of [...new Set(list.flatMap((m) => [m.idolA, m.idolB]))].sort()) {
      const own = list.filter((m) => m.idolA === idol || m.idolB === idol);
      if (own.some((m) => loserOf(m) === idol)) continue;
      const draws = own.filter((m) => m.result === "D").length;
      out.push({ kind: "unbeaten", idol, league, wins: own.length - draws, draws });
    }

    // Revenge and domination: for each pair in this league, track who won each leg.
    const pairWins = new Map<string, string[]>(); // sorted pair key → winners in play order
    for (const m of list) {
      if (m.result === "D") continue;
      const key = [m.idolA, m.idolB].sort().join("|");
      const winner = m.result === "A" ? m.idolA : m.idolB;
      pairWins.set(key, [...(pairWins.get(key) ?? []), winner]);
    }
    for (const [key, winners] of [...pairWins].sort(([a], [b]) => a.localeCompare(b))) {
      if (winners.length !== 2) continue;
      const [a, b] = key.split("|") as [string, string];
      if (winners[0] !== winners[1]) {
        // Leg 1 loser won leg 2 = revenge
        const idol = winners[1]!, foe = idol === a ? b : a;
        out.push({ kind: "revenge", idol, foe, comp: league });
      } else {
        // Same winner both legs = domination
        const idol = winners[0]!, foe = idol === a ? b : a;
        out.push({ kind: "domination", idol, foe, comp: league });
      }
    }
  }

  // DE bracket revenge: idol lost to foe earlier in the same comp, then beat them in a later match.
  const brackets = new Map<string, SimMatch[]>();
  for (const m of matches) if (m.stage !== "LG" && m.stage !== "SW") brackets.set(m.comp, [...(brackets.get(m.comp) ?? []), m]);
  for (const [comp, list] of [...brackets].sort(([a], [b]) => a.localeCompare(b))) {
    const pairWins = new Map<string, string[]>();
    for (const m of list) {
      if (m.result === "D") continue;
      const key = [m.idolA, m.idolB].sort().join("|");
      const winner = m.result === "A" ? m.idolA : m.idolB;
      pairWins.set(key, [...(pairWins.get(key) ?? []), winner]);
    }
    for (const [key, winners] of [...pairWins].sort(([a], [b]) => a.localeCompare(b))) {
      if (winners.length < 2 || winners[0] === winners[winners.length - 1]) continue;
      // Last match winner differs from first = revenge
      const idol = winners[winners.length - 1]!, foe = key.split("|").find((id) => id !== idol)!;
      out.push({ kind: "de-revenge", idol, foe, comp });
    }
  }

  // Heated rivalry: top-tier idols meeting across top-tier tournaments. prestige ≥ 0.8, initial rating ≥ 90, ≥3 meetings, ≥2 comps.
  const TOP_PRESTIGE = 0.8, TOP_RATING = 90, MIN_HEATED = 3, MIN_COMPS = 2;
  const initRating = new Map<string, number>();
  for (const m of matches) {
    if (!initRating.has(m.idolA)) initRating.set(m.idolA, m.ratingA);
    if (!initRating.has(m.idolB)) initRating.set(m.idolB, m.ratingB);
  }
  const isTop = (id: string) => (initRating.get(id) ?? 0) >= TOP_RATING;
  const heatedPairs = new Map<string, { wins: [number, number]; comps: Set<string> }>();
  for (const m of matches) {
    if ((prestigeOf(m.comp) ?? 0) < TOP_PRESTIGE || !isTop(m.idolA) || !isTop(m.idolB)) continue;
    const [a, b] = [m.idolA, m.idolB].sort() as [string, string];
    const key = `${a}|${b}`;
    const d = heatedPairs.get(key) ?? { wins: [0, 0], comps: new Set<string>() };
    if (m.result !== "D") { const w = m.result === "A" ? m.idolA : m.idolB; if (w === a) d.wins[0]++; else d.wins[1]++; }
    d.comps.add(m.comp);
    heatedPairs.set(key, d);
  }
  for (const [key, { wins, comps }] of [...heatedPairs].sort(([a], [b]) => a.localeCompare(b))) {
    if (wins[0] + wins[1] < MIN_HEATED || comps.size < MIN_COMPS) continue;
    const [a, b] = key.split("|") as [string, string];
    out.push({ kind: "heated-rivalry", a, b, meetings: wins[0] + wins[1], winsA: wins[0], winsB: wins[1] });
  }

  return out;
}
