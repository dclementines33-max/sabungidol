// Marble Race panel · Arenas: every arena with its colour and course, a name the user can change (matches keep the id,
// so a new name shows everywhere at once), whether it is in the draw for matches, and a test race on it.
import { ARENAS } from "@sabung/shared";
import { useArenaSettings } from "../../data/arenaSettings";

export function ArenaList({ onRace }: { onRace: (id: string) => void }) {
  const { names, off, rename, toggle } = useArenaSettings();
  const on = ARENAS.length - off.length;
  return (
    <>
      <p className="m-0 text-sm text-text-secondary">{on} of {ARENAS.length} arenas in the draw. Every match (marble race, wheel, presets, manual or a bulk simulation) is played on one drawn from these; a grand final changes arena every game. At least one stays on.</p>
      <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {ARENAS.map((a) => {
          const active = !off.includes(a.id);
          return (
            <li key={a.id} className="panel relative overflow-hidden p-4" style={{ boxShadow: `inset 4px 0 0 ${active ? a.glow : "var(--color-muted)"}` }}>
              <label className="block">
                <span className="sr-only">Name of {a.name}</span>
                <input defaultValue={names[a.id] || a.name} maxLength={40} onBlur={(e) => rename(a.id, e.target.value === a.name ? "" : e.target.value)}
                  className="w-full border-b-2 border-transparent bg-transparent font-gothic text-lg uppercase focus:border-accent-bright focus:outline-none" />
              </label>
              <p className="m-0 mt-1 text-xs text-text-secondary">{a.tagline}</p>
              {names[a.id] && <p className="m-0 mt-1 text-xs text-text-secondary">Originally “{a.name}”</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={active} disabled={active && on === 1} onChange={() => toggle(a.id)} className="accent-accent-bright" />
                  In the draw
                </label>
                <button type="button" onClick={() => onRace(a.id)} className="chip cursor-pointer bg-stage-hi py-1 text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright">
                  <span>Test race here</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
