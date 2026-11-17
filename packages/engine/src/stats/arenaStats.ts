// Arena stats (2026-11-18): every match since arenas exist is played on one (a grand final: one per game). An
// appearance = one idol on one arena in one match: W/D/L from the match result, or for a grand final each game's W/L on
// its own arena. Matches played before arenas (arenas = null) are not here at all.
import { arenaOfGame } from "@sabung/shared";

export type ArenaRow = {
  seasonId: string; idolA: string; idolB: string; result: "A" | "B" | "D"; games: ("A" | "B")[]; arenas: string[]; ratingA: number; ratingB: number;
};
export type WDL = { w: number; d: number; l: number };
type Appearance = { arena: string; idol: string; outcome: keyof WDL; rating: number };

export function appearances(rows: readonly ArenaRow[]): Appearance[] {
  const out: Appearance[] = [];
  for (const m of rows) {
    if (m.arenas.length <= 1) {
      const arena = m.arenas[0]!;
      out.push({ arena, idol: m.idolA, outcome: m.result === "D" ? "d" : m.result === "A" ? "w" : "l", rating: m.ratingA });
      out.push({ arena, idol: m.idolB, outcome: m.result === "D" ? "d" : m.result === "B" ? "w" : "l", rating: m.ratingB });
    } else {
      m.games.forEach((g, i) => {
        const arena = arenaOfGame(m.arenas, i)!;
        out.push({ arena, idol: m.idolA, outcome: g === "A" ? "w" : "l", rating: m.ratingA });
        out.push({ arena, idol: m.idolB, outcome: g === "B" ? "w" : "l", rating: m.ratingB });
      });
    }
  }
  return out;
}

// idol → arena → W-D-L
export function idolArenaRecords(rows: readonly ArenaRow[]): Map<string, Map<string, WDL>> {
  const all = new Map<string, Map<string, WDL>>();
  for (const a of appearances(rows)) {
    const mine = all.get(a.idol) ?? all.set(a.idol, new Map()).get(a.idol)!;
    const r = mine.get(a.arena) ?? mine.set(a.arena, { w: 0, d: 0, l: 0 }).get(a.arena)!;
    r[a.outcome]++;
  }
  return all;
}

// How many matches each arena hosted (a grand final counts once on each arena it visited).
export function arenaUsage(rows: readonly ArenaRow[]): Map<string, number> {
  const n = new Map<string, number>();
  for (const m of rows) for (const a of new Set(m.arenas)) n.set(a, (n.get(a) ?? 0) + 1);
  return n;
}

export const played = (r: WDL) => r.w + r.d + r.l;
export const winPct = (r: WDL) => (played(r) ? r.w / played(r) : 0);

export type ArenaHonours = {
  mostUsed: { arena: string; matches: number } | null;
  ruler: { idol: string; arena: string; wins: number } | null; // most wins on one arena
  globetrotter: { idol: string; arenas: number } | null; // won on the most different arenas
  specialist: { idol: string; arena: string; pct: number; played: number } | null; // best win rate on one arena, 5+ played
};

export function arenaHonours(rows: readonly ArenaRow[], minPlayed = 5): ArenaHonours {
  const usage = [...arenaUsage(rows)].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  let ruler: ArenaHonours["ruler"] = null, globetrotter: ArenaHonours["globetrotter"] = null, specialist: ArenaHonours["specialist"] = null;
  for (const [idol, arenas] of [...idolArenaRecords(rows)].sort((x, y) => x[0].localeCompare(y[0]))) {
    let won = 0;
    for (const [arena, r] of arenas) {
      if (r.w) won++;
      if (r.w > (ruler?.wins ?? 0)) ruler = { idol, arena, wins: r.w };
      const pct = winPct(r);
      if (played(r) >= minPlayed && (!specialist || pct > specialist.pct || (pct === specialist.pct && played(r) > specialist.played))) specialist = { idol, arena, pct, played: played(r) };
    }
    if (won > (globetrotter?.arenas ?? 0)) globetrotter = { idol, arenas: won };
  }
  return { mostUsed: usage[0] ? { arena: usage[0][0], matches: usage[0][1] } : null, ruler, globetrotter, specialist };
}

// Season Story (one season's rows): an idol unbeaten on one arena with 4+ wins (a fortress), and a top idol (85+) who
// lost 3+ times on one arena without a win there (a curse). The biggest three of each.
export type ArenaStory =
  | { kind: "arena-fortress"; idol: string; arena: string; wins: number; draws: number }
  | { kind: "arena-curse"; idol: string; arena: string; losses: number; rating: number };

export function arenaNews(rows: readonly ArenaRow[]): ArenaStory[] {
  const rating = new Map<string, number>();
  for (const a of appearances(rows)) rating.set(a.idol, Math.max(rating.get(a.idol) ?? 0, a.rating));
  const fortress: ArenaStory[] = [], curse: ArenaStory[] = [];
  for (const [idol, arenas] of idolArenaRecords(rows)) {
    for (const [arena, r] of arenas) {
      if (r.l === 0 && r.w >= 4) fortress.push({ kind: "arena-fortress", idol, arena, wins: r.w, draws: r.d });
      if (r.w === 0 && r.l >= 3 && rating.get(idol)! >= 85) curse.push({ kind: "arena-curse", idol, arena, losses: r.l, rating: rating.get(idol)! });
    }
  }
  const size = (s: ArenaStory) => (s.kind === "arena-fortress" ? s.wins : s.losses * 100 + s.rating);
  return [fortress, curse].flatMap((list) => list.sort((x, y) => size(y) - size(x) || x.idol.localeCompare(y.idol)).slice(0, 3));
}
