// Idol Profile → Arenas (2026-11-18): her favourite arena (most wins), her nightmare (most losses) and her W-D-L on every
// arena she has played. Matches from before arenas existed are not counted.
import { useArenaName } from "../../data/arenaSettings";
import type { ArenaLine } from "../../data/arenaWorker";
import { ArenaRecordTable, glowOf } from "../arenas/ArenaRecordTable";
import { useArenaRead } from "../arenas/useArenaRead";

const pick = (lines: ArenaLine[], key: "w" | "l") => [...lines].sort((x, y) => y[key] - x[key] || (x.w + x.d + x.l) - (y.w + y.d + y.l))[0];

export function ProfileArenas({ idolId, name }: { idolId: string; name: string }) {
  const lines = useArenaRead("idol", idolId);
  const arena = useArenaName();
  if (!lines) return <p className="text-text-secondary">Loading the arenas…</p>;
  if (!lines.length) return <p className="m-0 text-text-secondary">{name} hasn't played a match on an arena yet. Every match from now on is played on one.</p>;
  const fav = pick(lines, "w"), bad = pick(lines, "l");
  const card = (title: string, r: ArenaLine | undefined, note: string) => (
    <div className="panel p-4" style={{ boxShadow: r ? `inset 4px 0 0 ${glowOf(r.arena)}` : undefined }}>
      <p className="kicker m-0 text-text-secondary">{title}</p>
      <p className="m-0 mt-1 font-gothic text-xl">{r ? arena(r.arena) : "—"}</p>
      <p className="m-0 mt-1 font-mono text-sm text-text-secondary">{r ? `${r.w}-${r.d}-${r.l} · ${note}` : "No losses anywhere"}</p>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {card("Favourite arena", fav && fav.w ? fav : undefined, "most wins")}
        {card("Nightmare arena", bad && bad.l ? bad : undefined, "most losses")}
      </div>
      <ArenaRecordTable lines={lines} label={`${name} per arena`} />
    </div>
  );
}
