// "On This Day" (PRD §8 Home): the most surprising results of the same matchday in earlier seasons, as a
// horizontal strip of cards.
import { IdolLink } from "../wiki/IdolLink";

type Match = { id: string; idolA: string; idolB: string; scoreA: number; scoreB: number };

export function OnThisDay({ matches }: { matches: Match[] }) {
  return (
    <section aria-labelledby="on-this-day" className="space-y-3">
      <h2 id="on-this-day" className="section-title">On This Day</h2>
      {matches.length === 0 ? <p className="m-0 text-sm text-text-secondary">No earlier season on this matchday yet.</p> : (
        <ul className="m-0 flex list-none gap-3 overflow-x-auto p-0 pb-2" aria-label="Matches on the same day">
          {matches.map((m) => (
            <li key={m.id} className="w-56 shrink-0 panel p-3 text-sm">
              <p className="m-0 font-mono text-xs text-text-secondary">{m.id.split("-").slice(0, 4).join(" · ")}</p>
              <p className="m-0 mt-1"><IdolLink id={m.idolA} /> <span className="font-mono">{m.scoreA}–{m.scoreB}</span> <IdolLink id={m.idolB} /></p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
