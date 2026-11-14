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
      <h2 id="rivalries" className="m-0 text-[clamp(1.75rem,4vw,3rem)]">Heated Rivalries</h2>
      <p className="kicker m-0 text-text-secondary">Top 10 most frequent matchups</p>
      {top.length === 0 ? <p className="text-sm text-text-secondary">No matches yet.</p> : (
        <ol className="m-0 list-none p-0 text-sm">
          {top.map((r, i) => (
            <li key={`${r.a}|${r.b}`} className="border-b border-border/50" style={{ marginLeft: `${(i % 3) * 1.25}rem` }}>
              <Link to="/wiki/h2h" search={{ a: r.a, b: r.b }}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-3 py-2 hover:bg-surface-hover/50 focus-visible:outline-2 focus-visible:outline-accent-bright">
                <span className="font-gothic text-2xl text-accent-bright">{i + 1}</span>
                <span className="flex min-w-0 items-center justify-end gap-2"><span className="truncate">{name(r.a)}</span><IdolPhoto idolId={r.a} size={64} className="h-9 w-7 shrink-0" /></span>
                <span className="font-display tabular-nums">{r.winsA}–{r.draws}–{r.winsB}</span>
                <span className="flex min-w-0 items-center gap-2"><IdolPhoto idolId={r.b} size={64} className="h-9 w-7 shrink-0" /><span className="truncate">{name(r.b)}</span></span>
                <span className="font-mono text-xs text-text-secondary">{r.meetings} matches</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
