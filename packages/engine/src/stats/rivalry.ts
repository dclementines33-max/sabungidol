// Official rivalries (2026-11-18): a pair of idols becomes a named rivalry once their meetings say so. Close and frequent
// = Eternal Rivalry (10+ meetings) / Blood Feud (6+) / Rising Rivalry (4+); one-sided and frequent = Nemesis. Each gets a
// fixed name (from the two ids, so it never changes) and a heat score for ordering. A match between them is a Grudge Match.
import type { PairRecord } from "./matchRecords";

export type RivalryTier = "eternal" | "feud" | "rising" | "nemesis";
export type Rivalry = {
  a: string; b: string; tier: RivalryTier; name: string; heat: number;
  meetings: number; winsA: number; winsB: number; draws: number;
  leader: string | null; // who leads the series (null = level)
};
export type PairLine = { meetings: number; winsA: number; winsB: number; draws: number };

export const RIVALRY_TIER: Record<RivalryTier, string> = { eternal: "Eternal Rivalry", feud: "Blood Feud", rising: "Rising Rivalry", nemesis: "Nemesis" };

const NAMES = [
  "The Crown War", "Blood Moon Derby", "The Mirror Match", "Clash of Spotlights", "The Long Night", "Velvet Vendetta",
  "Thunder & Silk", "Unfinished Business", "Stage of Thorns", "The Twin Flames", "Neon Feud", "The Last Encore",
  "Rose & Razor", "The Cold Front", "Midnight Showdown", "The Broken Mic", "Glass Throne", "Static & Fire",
];

const ORDER: Record<RivalryTier, number> = { eternal: 0, feud: 1, nemesis: 2, rising: 3 }; // a bigger tier always ranks higher
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function rivalryOf(a: string, b: string, p: PairLine): Rivalry | null {
  if (a === b || p.meetings < 4) return null;
  const share = (p.winsA + p.draws / 2) / p.meetings;
  const close = 1 - 2 * Math.abs(share - 0.5); // 1 = dead level, 0 = one side always wins
  const tier: RivalryTier | null =
    p.meetings >= 10 && close >= 0.7 ? "eternal"
      : p.meetings >= 6 && close >= 0.55 ? "feud"
        : close >= 0.6 ? "rising"
          : p.meetings >= 5 && close <= 0.4 ? "nemesis" : null;
  if (!tier) return null;
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return {
    a, b, tier, ...p,
    name: NAMES[hash(`${lo}|${hi}`) % NAMES.length]!,
    heat: Math.round(p.meetings * (0.4 + close) * (tier === "nemesis" ? 0.7 : 1) * 10) / 10,
    leader: p.winsA === p.winsB ? null : p.winsA > p.winsB ? a : b,
  };
}

// Every official rivalry from the career head-to-head pairs: by tier, then hottest first.
export function officialRivalries(pairs: Record<string, PairRecord>): Rivalry[] {
  return Object.entries(pairs).flatMap(([key, p]) => {
    const [lo, hi] = key.split("|") as [string, string];
    const r = rivalryOf(lo, hi, { meetings: p.meetings, winsA: p.winsLo, winsB: p.winsHi, draws: p.draws });
    return r ? [r] : [];
  }).sort((x, y) => ORDER[x.tier] - ORDER[y.tier] || y.heat - x.heat || y.meetings - x.meetings || `${x.a}|${x.b}`.localeCompare(`${y.a}|${y.b}`));
}
