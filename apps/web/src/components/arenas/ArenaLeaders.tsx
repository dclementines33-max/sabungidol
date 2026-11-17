// The best idols on one arena (most wins, then win rate; top 10): Career Stats → Arenas and the Arenas page. All time,
// or one season when the page passes it.
import { ARENAS } from "@sabung/shared";
import { useState } from "react";
import { useArenaName } from "../../data/arenaSettings";
import { Select } from "../idolDatabase/IdolFilters";
import { IdolLink } from "../wiki/IdolLink";
import { useArenaRead } from "./useArenaRead";

export function ArenaLeaders({ seasonId }: { seasonId?: string }) {
  const name = useArenaName();
  const data = useArenaRead("overview", seasonId);
  const [arena, setArena] = useState(ARENAS[0]!.id);
  const rows = data?.leaders[arena] ?? [];
  return (
    <div className="space-y-3">
      <Select label="Arena" value={arena} onChange={setArena} options={ARENAS.map((a): [string, string] => [a.id, `${name(a.id)} (${data?.usage[a.id] ?? 0})`])} />
      {!data ? <p className="text-text-secondary">Loading the arenas…</p> : rows.length === 0 ? <p className="m-0 text-text-secondary">No match on {name(arena)} yet.</p> : (
        <table className="board w-full text-sm" aria-label={`Best idols on ${name(arena)}`}>
          <thead><tr><th>#</th><th className="text-left">Idol</th><th>W</th><th>D</th><th>L</th><th>Win %</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.idol} className={i === 0 ? "is-top" : undefined}>
                <td className="rank">{i + 1}</td>
                <td className="text-left"><IdolLink id={r.idol} /></td>
                <td className="font-mono tabular-nums">{r.w}</td><td className="font-mono tabular-nums">{r.d}</td><td className="font-mono tabular-nums">{r.l}</td>
                <td className="pts">{Math.round((100 * r.w) / Math.max(1, r.w + r.d + r.l))}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
