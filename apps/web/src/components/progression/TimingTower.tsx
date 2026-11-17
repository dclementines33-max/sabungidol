// Timing tower (2026-11-17): a live-broadcast standings graphic for one league at any matchday — position, an arrow for
// places gained or lost since the matchday before, the idol, points and the gap to the leader. Rows slide to their new
// place as the replay moves (no slide with prefers-reduced-motion). Pure view: rows come from tower().
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { pointsByMatchday } from "../charts/titleRace";

const ROW = 36; // px (row + 3px gap)

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
    <ol aria-label={label} className="relative m-0 list-none overflow-hidden p-0" style={{ height: rows.length * ROW }}>
      {rows.map((r) => (
        <li key={r.idolId} className={`absolute inset-x-0 flex items-center gap-3 pr-3 text-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${r.rank === 1 ? "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-winner)_28%,transparent),color-mix(in_oklab,var(--color-stage-hi)_70%,transparent)_55%)]" : r.rank % 2 ? "bg-stage-hi/70" : "bg-stage-hi/40"}`}
          style={{ height: ROW - 3, transform: `translateY(${(r.rank - 1) * ROW}px)` }}>
          <span className={`score flex h-full w-10 shrink-0 -skew-x-12 items-center justify-center text-base ${r.rank === 1 ? "bg-winner text-on-fill" : r.rank <= 3 ? "bg-accent text-on-accent" : "bg-bg-base/70 text-text-primary"}`}><span className="skew-x-12">{r.rank}</span></span>
          <span className={`w-8 shrink-0 font-mono text-xs tabular-nums ${r.moved > 0 ? "text-cool" : r.moved < 0 ? "text-accent-bright" : "text-text-secondary"}`}>
            <span aria-hidden="true">{r.moved > 0 ? `▲${r.moved}` : r.moved < 0 ? `▼${-r.moved}` : "–"}</span>
            <span className="sr-only">{r.moved > 0 ? `up ${r.moved}` : r.moved < 0 ? `down ${-r.moved}` : "no change"}</span>
          </span>
          <IdolPhoto idolId={r.idolId} size={64} className="h-7 w-6 shrink-0 rounded-[3px]" />
          <span className="min-w-0 flex-1 truncate font-display uppercase">{lookup(r.idolId)?.name ?? r.idolId}</span>
          <span className={`score w-10 shrink-0 text-right text-base ${r.rank === 1 ? "text-winner" : ""}`}>{r.points}</span>
          <span className="w-14 shrink-0 text-right font-mono text-xs text-text-secondary tabular-nums">{r.rank === 1 ? "Leader" : r.gap ? `−${r.gap}` : "Level"}</span>
        </li>
      ))}
    </ol>
  );
}
