// Marble Race panel · Test race: pick 2–20 idols (2 = a Best-of-N series, 3+ = a Grand Prix with F1 points), the series
// length and the arena (or let the system draw like a real match), then watch. Nothing is saved.
import { ARENAS, drawArenas } from "@sabung/shared";
import { Button, IdolPhoto, SearchableIdolSelect, useIdolSource } from "@sabung/ui";
import { Shuffle } from "@sabung/ui/icons";
import { useEffect, useState } from "react";
import { arenaPool, useArenaName, useArenaSettings } from "../../data/arenaSettings";
import { COLORS } from "../../marble/colors";
import { useEntries } from "../ranking/useEntries";
import { Choice } from "./Choice";
import { RaceDialog } from "./RaceDialog";

const BEST_OF = [3, 4, 5, 7].map((n) => ({ id: n, label: `Bo${n}` }));

export function TestRace({ arena, onArena }: { arena: string; onArena: (id: string) => void }) {
  const entries = useEntries("idol");
  const source = useIdolSource();
  const { names, led, setup } = useArenaSettings();
  const arenaName = useArenaName();
  const [field, setField] = useState<string[]>([]);
  const [bestOf, setBestOf] = useState(5);
  const [grand, setGrand] = useState(false);
  const [run, setRun] = useState(0);
  const [arenaIds, setArenaIds] = useState<string[]>([]);
  const ids = entries?.list.map((e) => e.id) ?? [];
  useEffect(() => { if (!field.length && ids.length >= 2) setField(ids.slice(0, 2)); }, [ids.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickRandom = (n: number, keep: string[] = []) => {
    const free = ids.filter((id) => !keep.includes(id));
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [free[i], free[j]] = [free[j]!, free[i]!]; }
    return [...keep, ...free].slice(0, n);
  };
  const resize = (n: number) => setField(n <= field.length ? field.slice(0, n) : pickRandom(n, field));
  const start = () => {
    setArenaIds(arena ? (grand ? Array(bestOf).fill(arena) : [arena]) : drawArenas(arenaPool(), grand, bestOf));
    setRun((n) => n + 1);
  };
  if (!entries) return <p className="text-text-secondary">Loading the idols…</p>;

  const players = field.map((id) => { const i = source.idol(id); return { name: i?.name ?? "?", photo: source.photo(id, 256) ?? null, rating: i?.rating ?? 75 }; });
  const photos = field.slice(0, 2).flatMap((id) => { const url = source.photo(id, 1024); return url ? [{ url, caption: source.idol(id)?.name }] : []; });
  if (led.length) photos.push({ url: led[Math.floor(Math.random() * led.length)]!, caption: undefined });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm">
          <span className="kicker text-text-secondary">Marbles</span>
          <input type="range" min={2} max={20} value={field.length || 2} onChange={(e) => resize(+e.target.value)} className="accent-accent-bright" />
          <output className="score text-lg">{field.length}</output>
        </label>
        <Button onClick={() => setField(pickRandom(field.length))}><span className="inline-flex items-center gap-2"><Shuffle size={14} aria-hidden="true" />Shuffle the field</span></Button>
      </div>
      <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 md:grid-cols-3">
        {field.map((id, k) => (
          <li key={k} className="flex items-center gap-2 bg-stage-hi/60 p-2" style={{ boxShadow: `inset 3px 0 0 ${COLORS[k]}` }}>
            <IdolPhoto idolId={id} size={64} className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <SearchableIdolSelect label={`Marble ${k + 1}`} idolIds={ids} value={id} onChange={(v) => v && setField(field.map((x, j) => (j === k ? v : x)))} />
            </div>
          </li>
        ))}
      </ol>
      <p className="m-0 text-sm text-text-secondary">{field.length === 2 ? "Two marbles: a Best-of series with the app's rules (Bo4 can end 2–2)." : `${field.length} marbles: a Grand Prix, F1 points per race (25-18-15-12-10-8-6-4-2-1).`}</p>
      <Choice label={field.length === 2 ? "Best of" : "Races"} value={bestOf} options={field.length === 2 ? BEST_OF : BEST_OF.map((o) => ({ ...o, label: `${o.id} races` }))} onChange={setBestOf} />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="kicker text-text-secondary">Arena</span>
          <select value={arena} onChange={(e) => onArena(e.target.value)} className="rounded-control border border-border-subtle bg-bg-base px-2 py-1.5">
            <option value="">The system draws (like a match)</option>
            {ARENAS.map((a) => <option key={a.id} value={a.id}>{arenaName(a.id)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={grand} onChange={(e) => setGrand(e.target.checked)} className="accent-accent-bright" /> Grand final: a new arena every game</label>
      </div>
      <Button variant="primary" disabled={field.length < 2} onClick={start}>Start the test race</Button>

      <RaceDialog open={run > 0} onOpenChange={(o) => { if (!o) setRun(0); }} label="Marble race · test" title="Test race" run={run}
        options={{ players, bestOf, arenaIds, advantage: setup.advantage, led: { title: "Test race", photos }, names }}
        actions={() => (
          <>
            <Button variant="primary" onClick={start}>Race again</Button>
            <Button onClick={() => setRun(0)}>Close</Button>
          </>
        )} />
    </div>
  );
}
