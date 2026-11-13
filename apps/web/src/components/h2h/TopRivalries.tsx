// "Heated Rivalries: Top 10 Most Matchups" (PRD §8 Head to Head); each row opens that pair.
import { Link } from "@tanstack/react-router";
import { IdolLink } from "../wiki/IdolLink";

type Rivalry = { a: string; b: string; meetings: number; winsA: number; winsB: number; draws: number };

export function TopRivalries({ top }: { top: Rivalry[] }) {
  return (
    <section aria-labelledby="rivalries" className="space-y-2">
      <h2 id="rivalries" className="m-0 font-display text-xl uppercase">Heated Rivalries: Top 10 Most Matchups</h2>
      {top.length === 0 ? <p className="text-sm text-text-secondary">Belum ada match.</p> : (
        <ol className="m-0 list-none divide-y divide-border rounded-card border border-border p-0 text-sm">
          {top.map((r, i) => (
            <li key={`${r.a}|${r.b}`} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
              <span className="font-mono text-text-secondary">{i + 1}</span>
              <span className="truncate text-right"><IdolLink id={r.a} /></span>
              <span className="font-mono tabular-nums">{r.winsA}–{r.draws}–{r.winsB}</span>
              <span className="truncate"><IdolLink id={r.b} /></span>
              <Link to="/wiki/h2h" search={{ a: r.a, b: r.b }} className="text-accent-bright underline underline-offset-4">{r.meetings} match</Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
