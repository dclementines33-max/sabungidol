// A girl group against the others (2026-11-18): its members' head-to-head pairs summed per opposing group, and its civil
// wars (members against each other). Pure: built in the Worker from the cached pairs; soloists are no group.
import type { PairRecord } from "@sabung/engine";

export type GroupLine = { groupId: string; meetings: number; wins: number; draws: number; losses: number };
export type CivilWar = { a: string; b: string; meetings: number; winsA: number; winsB: number; draws: number };

export function groupMatchups(pairs: Record<string, PairRecord>, groupOf: Map<string, string | null>, groupId: string) {
  const vs = new Map<string, GroupLine>();
  const civil: CivilWar[] = [];
  for (const [key, p] of Object.entries(pairs)) {
    const [lo, hi] = key.split("|") as [string, string];
    const gl = groupOf.get(lo), gh = groupOf.get(hi);
    if (gl === groupId && gh === groupId) { civil.push({ a: lo, b: hi, meetings: p.meetings, winsA: p.winsLo, winsB: p.winsHi, draws: p.draws }); continue; }
    const mine = gl === groupId ? "lo" : gh === groupId ? "hi" : null;
    const other = mine === "lo" ? gh : gl;
    if (!mine || !other) continue;
    const line = vs.get(other) ?? { groupId: other, meetings: 0, wins: 0, draws: 0, losses: 0 };
    line.meetings += p.meetings;
    line.draws += p.draws;
    line.wins += mine === "lo" ? p.winsLo : p.winsHi;
    line.losses += mine === "lo" ? p.winsHi : p.winsLo;
    vs.set(other, line);
  }
  return {
    rivals: [...vs.values()].sort((x, y) => y.meetings - x.meetings || x.groupId.localeCompare(y.groupId)),
    civil: civil.sort((x, y) => y.meetings - x.meetings || `${x.a}|${x.b}`.localeCompare(`${y.a}|${y.b}`)),
  };
}
