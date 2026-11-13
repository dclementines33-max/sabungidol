// Records that belong to pairs and single matches (PRD §7.3, Head to Head §8): meetings per pair and the
// biggest upsets (largest rating gap the weaker idol overcame). Folded per finished season like career stats.
import type { SimMatch } from "../season/types";

export type PairRecord = { meetings: number; winsLo: number; winsHi: number; draws: number }; // lo/hi = the two ids sorted
export type Upset = { matchId: string; season: number; winner: string; loser: string; gap: number };
export type MatchRecords = { pairs: Record<string, PairRecord>; upsets: Upset[] };

const KEEP_UPSETS = 100;
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function foldMatchRecords(previous: MatchRecords, season: number, matches: SimMatch[]): MatchRecords {
  const pairs = structuredClone(previous.pairs);
  const upsets = [...previous.upsets];
  for (const m of matches) {
    const key = pairKey(m.idolA, m.idolB);
    const p = (pairs[key] ??= { meetings: 0, winsLo: 0, winsHi: 0, draws: 0 });
    p.meetings++;
    if (m.result === "D") p.draws++;
    else if ((m.result === "A" ? m.idolA : m.idolB) === key.split("|")[0]) p.winsLo++;
    else p.winsHi++;
    if (m.result === "D") continue;
    const [winner, loser, wr, lr] = m.result === "A" ? [m.idolA, m.idolB, m.ratingA, m.ratingB] : [m.idolB, m.idolA, m.ratingB, m.ratingA];
    if (lr > wr) upsets.push({ matchId: m.id, season, winner, loser, gap: lr - wr });
  }
  upsets.sort((x, y) => y.gap - x.gap || x.matchId.localeCompare(y.matchId));
  return { pairs, upsets: upsets.slice(0, KEEP_UPSETS) };
}
