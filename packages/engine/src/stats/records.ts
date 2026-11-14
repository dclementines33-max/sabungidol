// All-time records engine (PRD §7.3). Competition ranking with ties (1, 2, T3, T3, 5); the rank is fixed
// before any name search (a search only hides rows). Scope (active, group, league …) is applied first via
// `include`. Percentages need a minimum number of matches. Tie order: value → matches (fewer for a
// percentage, more for a total) → idol id. (The PRD's "first season reached" tie step is not tracked.)
import type { CareerRow } from "./careerStats";

export type RecordEntry = { idolId: string; value: number; matches: number; rank: number; tied: boolean };
type Category = { id: string; label: string; comp: string; kind: "total" | "percent"; value: (r: CareerRow) => number };

const TITLE_COMPS: [string, string][] = [["UZC", "Unzure Cup"], ["IDL", "The Idols"], ["INK", "Inkigayo Cup"], ["D1", "Division 1"], ["DSG", "Daesang Cup"], ["MBK", "Music Bank Cup"], ["NUG", "Nugu Cup"], ["BS", "B-Side Cup"], ["D2", "Division 2"]];

export const RECORD_CATEGORIES: Category[] = [
  { id: "titles", label: "Most titles", comp: "ALL", kind: "total", value: (r) => r.titles },
  ...TITLE_COMPS.map(([comp, name]): Category => ({ id: `titles-${comp}`, label: `${name} titles`, comp, kind: "total", value: (r) => r.titles })),
  { id: "wins", label: "Most wins", comp: "ALL", kind: "total", value: (r) => r.wins },
  { id: "win-rate", label: "Best win rate", comp: "ALL", kind: "percent", value: (r) => r.winRate },
  { id: "win-streak", label: "Longest win streak", comp: "ALL", kind: "total", value: (r) => r.bestWinStreak },
  { id: "unbeaten-streak", label: "Longest unbeaten run", comp: "ALL", kind: "total", value: (r) => r.bestUnbeatenStreak },
  { id: "reverse-sweeps", label: "Most reverse sweeps", comp: "ALL", kind: "total", value: (r) => r.reverseSweeps },
  { id: "finals", label: "Most finals", comp: "ALL", kind: "total", value: (r) => r.finals },
  { id: "league-season-points", label: "Most points in one league season", comp: "ALL", kind: "total", value: (r) => r.bestLeagueSeasonPoints },
  { id: "invincible", label: "Unbeaten league seasons", comp: "ALL", kind: "total", value: (r) => r.invincibleSeasons },
];

export function rankRecords(rows: { idolId: string; value: number; matches: number }[], kind: "total" | "percent"): RecordEntry[] {
  const sorted = [...rows].sort((a, b) => b.value - a.value || (kind === "percent" ? a.matches - b.matches : b.matches - a.matches) || a.idolId.localeCompare(b.idolId));
  return sorted.map((r, i) => {
    const rank = sorted.findIndex((x) => x.value === r.value) + 1; // first index with this value
    return { ...r, rank, tied: sorted[i - 1]?.value === r.value || sorted[i + 1]?.value === r.value };
  });
}

export function allTimeRecords(rows: CareerRow[], { minMatches = 50, include = () => true }: { minMatches?: number; include?: (idolId: string) => boolean } = {}) {
  return RECORD_CATEGORIES.map((c) => {
    const eligible = rows.filter((r) => r.comp === c.comp && include(r.idolId) && (c.kind === "total" || r.matches >= minMatches));
    const entries = rankRecords(eligible.map((r) => ({ idolId: r.idolId, value: c.value(r), matches: r.matches })), c.kind).filter((e) => e.value > 0);
    return { id: c.id, label: c.label, kind: c.kind, entries };
  });
}

// The place as a plain number (user: "T3" and "#3 bersama" both read badly); a shared place shows the same number twice.
export const rankLabel = (e: RecordEntry) => String(e.rank);
