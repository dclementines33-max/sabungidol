// Two more Season Story kinds (Fase 6 step 9): a league points record broken, and a dramatic promotion — a Divisi 2
// idol outside the top 5 after matchday 30 who still finished in the promotion places (top 3).
import { computeStandings } from "../standings";
import type { SimMatch } from "../season/types";

export type DramaStory =
  | { kind: "points-record"; idol: string; league: string; points: number; previous: number }
  | { kind: "late-promotion"; idol: string; league: string; from: number; to: number };

const LATE = 30;

function table(matches: SimMatch[], upTo = 38) {
  const ids = [...new Set(matches.flatMap((m) => [m.idolA, m.idolB]))];
  return computeStandings(ids.map((id) => ({ id, startRating: 0 })), matches.filter((m) => Number(m.round.slice(2)) <= upTo));
}

// previousBest: the most league points any idol made in one earlier season (null = no earlier season).
export function seasonDrama(matches: SimMatch[], previousBest: number | null): DramaStory[] {
  const leagues = new Map<string, SimMatch[]>();
  for (const m of matches) if (m.stage === "LG" && m.comp !== "IDL") leagues.set(m.comp, [...(leagues.get(m.comp) ?? []), m]);
  const stories: DramaStory[] = [];
  let record: DramaStory | null = null;
  for (const [league, list] of [...leagues].sort(([a], [b]) => a.localeCompare(b))) {
    if (!list.some((m) => m.round === "MD38")) continue; // only finished leagues
    const final = table(list);
    const top = final[0]!;
    if (previousBest !== null && top.points > previousBest && (!record || top.points > (record as { points: number }).points)) {
      record = { kind: "points-record", idol: top.idolId, league, points: top.points, previous: previousBest };
    }
    if (league.startsWith("D2")) {
      const before = new Map(table(list, LATE).map((r) => [r.idolId, r.rank]));
      for (const r of final.slice(0, 3)) {
        const from = before.get(r.idolId) ?? 0;
        if (from > 5) stories.push({ kind: "late-promotion", idol: r.idolId, league, from, to: r.rank });
      }
    }
  }
  return record ? [record, ...stories] : stories;
}
