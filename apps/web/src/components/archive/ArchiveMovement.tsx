// Season Archive → promotion/relegation and the saved rating changes of the season.
import { IdolLink } from "../wiki/IdolLink";

type Change = { idolId: string; old: number; new: number };
const H3 = "section-title mb-3 text-base";

export function ArchiveMovement({ promoted, relegated, ratingChanges }: { promoted: string[]; relegated: string[]; ratingChanges: Change[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {([["Promoted to D1", promoted], ["Relegated to D2", relegated]] as const).map(([title, ids]) => (
        <section key={title} aria-label={title} className="panel p-4">
          <h3 className={H3}>{title} ({ids.length})</h3>
          <ul className="m-0 list-none space-y-1 p-0 text-sm">{ids.map((id) => <li key={id} className="rounded-[3px] bg-stage-hi/50 px-2 py-1"><IdolLink id={id} /></li>)}</ul>
        </section>
      ))}
      <section aria-label="Rating changes" className="panel p-4">
        <h3 className={H3}>Rating changes ({ratingChanges.length})</h3>
        {ratingChanges.length === 0 ? <p className="m-0 text-sm text-text-secondary">Not saved for this season yet.</p> : (
          <ul className="m-0 max-h-80 list-none space-y-0.5 overflow-auto p-0 text-sm">
            {ratingChanges.map((c) => <li key={c.idolId} className="flex gap-2"><IdolLink id={c.idolId} className="flex-1" /><span className="font-mono tabular-nums">{c.old} → <b className={c.new > c.old ? "text-cool" : c.new < c.old ? "text-accent-bright" : ""}>{c.new}</b></span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
