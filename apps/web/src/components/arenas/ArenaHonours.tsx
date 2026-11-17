// The arena honours (all time or one season): the most used arena, the Arena Ruler (most wins on one arena), the
// Globetrotter (won on the most different arenas) and the Arena Specialist (best win rate on one arena, 5+ played);
// then every arena by how often it was played, with its ruler.
import { ARENAS } from "@sabung/shared";
import type { ReactNode } from "react";
import { useArenaName } from "../../data/arenaSettings";
import { IdolLink } from "../wiki/IdolLink";
import { glowOf } from "./ArenaRecordTable";
import { useArenaRead } from "./useArenaRead";

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Honour({ title, glow, children, note }: { title: string; glow?: string; children: ReactNode; note: string }) {
  return (
    <div className="panel p-4" style={{ boxShadow: glow ? `inset 4px 0 0 ${glow}` : undefined }}>
      <p className="kicker m-0 text-winner">{title}</p>
      <p className="m-0 mt-1 font-gothic text-xl">{children}</p>
      <p className="m-0 mt-1 text-sm text-text-secondary">{note}</p>
    </div>
  );
}

export function ArenaHonours({ seasonId }: { seasonId?: string }) {
  const name = useArenaName();
  const data = useArenaRead("overview", seasonId);
  if (!data) return <p className="text-text-secondary">Loading the arenas…</p>;
  if (!data.matches) return <p className="m-0 text-text-secondary">No match has been played on an arena yet. Every match from now on is, however it is decided.</p>;
  const h = data.honours;
  const top = Math.max(1, ...Object.values(data.usage));
  const ranked = ARENAS.map((a) => a.id).sort((x, y) => (data.usage[y] ?? 0) - (data.usage[x] ?? 0));
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {h.mostUsed && <Honour title="Most used arena" glow={glowOf(h.mostUsed.arena)} note={h.mostUsed.matches === 1 ? "1 match" : `${h.mostUsed.matches} matches`}>{name(h.mostUsed.arena)}</Honour>}
        {h.ruler && <Honour title="Arena ruler" glow={glowOf(h.ruler.arena)} note={`${count(h.ruler.wins, "win")} on ${name(h.ruler.arena)}`}><IdolLink id={h.ruler.idol} /></Honour>}
        {h.globetrotter && <Honour title="Globetrotter" note={`Won on ${count(h.globetrotter.arenas, "arena")}`}><IdolLink id={h.globetrotter.idol} /></Honour>}
        {h.specialist && <Honour title="Arena specialist" glow={glowOf(h.specialist.arena)} note={`${Math.round(h.specialist.pct * 100)}% in ${h.specialist.played} on ${name(h.specialist.arena)}`}><IdolLink id={h.specialist.idol} /></Honour>}
      </div>
      <ol aria-label="Arenas by matches played" className="m-0 list-none space-y-1.5 p-0">
        {ranked.map((id, i) => {
          const ruler = data.leaders[id]?.[0];
          return (
            <li key={id} className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-3 sm:grid-cols-[2rem_14rem_minmax(0,1fr)_3.5rem_minmax(0,12rem)]">
              <span className="score text-lg text-text-secondary">{i + 1}</span>
              <span className="truncate font-display uppercase">{name(id)}</span>
              <span aria-hidden="true" className="hidden h-3 -skew-x-12 sm:block" style={{ width: `${(100 * (data.usage[id] ?? 0)) / top}%`, background: glowOf(id), boxShadow: `0 0 14px -2px ${glowOf(id)}` }} />
              <span className="score text-right text-lg">{data.usage[id] ?? 0}</span>
              <span className="hidden truncate text-sm text-text-secondary sm:block">{ruler?.w ? <>Ruler: <IdolLink id={ruler.idol} /> ({ruler.w})</> : "—"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
