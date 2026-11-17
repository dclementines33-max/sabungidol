// One W-D-L line per arena (an idol's record, or a pair's meetings from the first idol's side), most played first.
// A grand final counts each game on its own arena.
import { ARENAS } from "@sabung/shared";
import { useArenaName } from "../../data/arenaSettings";
import type { ArenaLine } from "../../data/arenaWorker";

export const glowOf = (id: string) => ARENAS.find((a) => a.id === id)?.glow ?? "var(--color-muted)";
const pct = (r: ArenaLine) => `${Math.round((100 * r.w) / Math.max(1, r.w + r.d + r.l))}%`;

export function ArenaRecordTable({ lines, label }: { lines: ArenaLine[]; label: string }) {
  const name = useArenaName();
  return (
    <table className="board w-full text-sm" aria-label={label}>
      <thead><tr><th className="text-left">Arena</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Win %</th></tr></thead>
      <tbody>
        {lines.map((r) => (
          <tr key={r.arena}>
            <td className="text-left"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: glowOf(r.arena), boxShadow: `0 0 8px ${glowOf(r.arena)}` }} />{name(r.arena)}</span></td>
            <td className="font-mono tabular-nums">{r.w + r.d + r.l}</td>
            <td className="font-mono tabular-nums">{r.w}</td>
            <td className="font-mono tabular-nums">{r.d}</td>
            <td className="font-mono tabular-nums">{r.l}</td>
            <td className="pts">{pct(r)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
