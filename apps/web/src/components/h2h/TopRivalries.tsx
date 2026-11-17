// "Heated Rivalries: Top 10 Most Matchups" (PRD §8 Head to Head); the whole row (the two idols, the score) opens
// that pair (Update 3: was a small "N match" link at the far right).
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Link } from "@tanstack/react-router";

type Rivalry = { a: string; b: string; meetings: number; winsA: number; winsB: number; draws: number };

export function TopRivalries({ top }: { top: Rivalry[] }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  return (
    <section aria-labelledby="rivalries" className="space-y-2">
      <h2 id="rivalries" className="section-title">Heated Rivalries</h2>
      <p className="kicker m-0 text-text-secondary">Top 10 most frequent matchups</p>
      {top.length === 0 ? <p className="text-sm text-text-secondary">No matches yet.</p> : (
        <ol className="m-0 mt-3 list-none space-y-1.5 p-0 text-sm">
          {top.map((r, i) => (
            <li key={`${r.a}|${r.b}`}>
              <Link to="/wiki/h2h" search={{ a: r.a, b: r.b }}
                className={`grid grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[4px] px-2 py-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright ${i === 0 ? "stage shadow-[inset_3px_0_0_var(--color-accent-bright)]" : "bg-stage-hi/50"}`}>
                <span className="score text-2xl text-accent-bright">{i + 1}</span>
                <span className="flex min-w-0 items-center justify-end gap-2"><span className="truncate font-display uppercase">{name(r.a)}</span><IdolPhoto idolId={r.a} size={64} className="h-9 w-7 shrink-0 rounded-[3px]" /></span>
                <span className="score -skew-x-12 bg-bg-base/80 px-2 py-1 shadow-[inset_0_-2px_0_var(--color-accent-bright)]">{r.winsA}–{r.draws}–{r.winsB}</span>
                <span className="flex min-w-0 items-center gap-2"><IdolPhoto idolId={r.b} size={64} className="h-9 w-7 shrink-0 rounded-[3px]" /><span className="truncate font-display uppercase">{name(r.b)}</span></span>
                <span className="font-mono text-xs text-text-secondary">{r.meetings} matches</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
