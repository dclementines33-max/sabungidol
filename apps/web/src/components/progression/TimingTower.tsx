// Timing tower (2026-11-17): a live-broadcast standings graphic for one league at any matchday — position, an arrow for
// places gained or lost since the matchday before, the idol, points and the gap to the leader. Rows slide to their new
// place as the replay moves (no slide with prefers-reduced-motion). Pure view: rows come from tower().
import { useIdolLookup } from "@sabung/ui";
import { pointsByMatchday } from "../charts/titleRace";

const ROW = 30; // px

export type TowerRow = { idolId: string; rank: number; moved: number; points: number; gap: number };

// The league at matchday `day` from its view (positions after each matchday, fixtures with scores).
export function tower(view: { roster: string[]; positions: Record<string, number[]>; fixtures: { round: string; matches: { idolA: string; idolB: string; scoreA?: number; scoreB?: number }[] }[] }, day: number): TowerRow[] {
  const points = pointsByMatchday(view.fixtures, view.roster);
  const rows = view.roster.map((idolId) => {
    const p = view.positions[idolId] ?? [];
    const rank = p[day - 1] ?? p.at(-1) ?? 0;
    return { idolId, rank, moved: day > 1 && p[day - 2] ? p[day - 2]! - rank : 0, points: points[idolId]?.[day] ?? points[idolId]?.at(-1) ?? 0, gap: 0 };
  }).filter((r) => r.rank > 0).sort((a, b) => a.rank - b.rank);
  const lead = rows[0]?.points ?? 0;
  return rows.map((r) => ({ ...r, gap: lead - r.points }));
}

export function TimingTower({ rows, label }: { rows: TowerRow[]; label: string }) {
  const lookup = useIdolLookup();
  return (
    <ol aria-label={label} className="relative m-0 list-none overflow-hidden rounded-card border border-border bg-bg-base/80 p-0" style={{ height: rows.length * ROW }}>
      {rows.map((r) => (
        <li key={r.idolId} className="absolute inset-x-0 flex items-center gap-3 border-b border-border/60 px-3 text-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ height: ROW, transform: `translateY(${(r.rank - 1) * ROW}px)` }}>
          <span className={`w-7 shrink-0 text-center font-display tabular-nums ${r.rank === 1 ? "bg-accent-bright text-on-fill" : ""}`}>{r.rank}</span>
          <span className={`w-8 shrink-0 font-mono text-xs tabular-nums ${r.moved > 0 ? "text-cool" : r.moved < 0 ? "text-accent-bright" : "text-text-secondary"}`}>
            <span aria-hidden="true">{r.moved > 0 ? `▲${r.moved}` : r.moved < 0 ? `▼${-r.moved}` : "–"}</span>
            <span className="sr-only">{r.moved > 0 ? `up ${r.moved}` : r.moved < 0 ? `down ${-r.moved}` : "no change"}</span>
          </span>
          <span className="min-w-0 flex-1 truncate font-display uppercase">{lookup(r.idolId)?.name ?? r.idolId}</span>
          <span className="w-10 shrink-0 text-right font-mono tabular-nums">{r.points}</span>
          <span className="w-14 shrink-0 text-right font-mono text-xs text-text-secondary tabular-nums">{r.rank === 1 ? "Leader" : r.gap ? `−${r.gap}` : "Level"}</span>
        </li>
      ))}
    </ol>
  );
}
