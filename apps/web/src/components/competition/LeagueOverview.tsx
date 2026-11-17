// A league's Overview (design round 2, Fight Night): the leader on a spotlit stage first — her card, points as a big
// scoreboard numeral, the record — then the chasing pack (#2–#5) as a ladder with the gap to the leader. The stakes
// first: who leads and by how much.
import { IdolCard, IdolPhoto, useIdolLookup } from "@sabung/ui";

type Row = { idolId: string; rank: number; played: number; wins: number; draws: number; losses: number; points: number };

export function LeagueOverview({ rows }: { rows: Row[] }) {
  const lookup = useIdolLookup();
  const [leader, ...pack] = rows.slice(0, 5);
  if (!leader) return null;
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" aria-label="Top five">
      <div className="stage relative isolate flex flex-col items-center gap-4 overflow-hidden rounded-card p-6 shadow-[inset_0_3px_0_var(--color-winner)] sm:flex-row sm:items-end">
        <span aria-hidden="true" className="score pointer-events-none absolute -top-6 -right-2 -z-10 text-ornament text-winner/15">01</span>
        <div className="w-44 shrink-0 sm:w-52"><IdolCard idolId={leader.idolId} /></div>
        <div className="min-w-0 text-center sm:text-left">
          <p className="m-0"><span className="chip bg-winner text-on-fill"><span>{leader.played ? "Leader" : "Top seed"}</span></span></p>
          <p className="m-0 mt-3 font-display text-section uppercase">{lookup(leader.idolId)?.name}</p>
          <p className="m-0 mt-3 flex items-baseline justify-center gap-2 sm:justify-start"><span className="score text-hero text-winner [text-shadow:0_0_40px_rgb(240_199_94/0.35)]">{leader.points}</span><span className="kicker text-text-secondary">points</span></p>
          <p className="m-0 mt-1 font-mono text-sm text-text-secondary">{leader.wins}–{leader.draws}–{leader.losses} · {leader.played} played</p>
        </div>
      </div>
      <ol className="m-0 flex list-none flex-col justify-center gap-2 p-0" aria-label="Chasing pack">
        {pack.map((r) => (
          <li key={r.idolId} className="panel flex items-center gap-4 p-3 pr-5">
            <span className="score flex h-12 w-12 shrink-0 -skew-x-12 items-center justify-center bg-accent text-xl text-on-accent"><span className="skew-x-12">{r.rank}</span></span>
            <IdolPhoto idolId={r.idolId} size={256} className="photo-frame w-12 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg uppercase">{lookup(r.idolId)?.name}</span>
              <span className="block font-mono text-xs text-text-secondary">{r.wins}–{r.draws}–{r.losses}</span>
            </span>
            <span className="text-right">
              <span className="score block text-2xl">{r.points}</span>
              <span className="block font-mono text-xs text-accent-bright">{leader.points - r.points ? `−${leader.points - r.points}` : "level"}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
