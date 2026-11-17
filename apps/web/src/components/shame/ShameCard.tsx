// One Hall of Shame category as a "most wanted" poster: the #1 in a tilted, washed-out photo with a red SHAME stamp, the
// category, a dry one-liner and the number; places 2–5 underneath. Pairs (a fall, a cursed matchup) name the other side.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import type { ShameCategory } from "../../data/hallOfShame";

function Who({ ids }: { ids: string[] }) {
  const lookup = useIdolLookup();
  const [id, other] = ids as [string, string | undefined];
  return (
    <span className="min-w-0">
      <Link to="/wiki/idols/$id" params={{ id }} className="block truncate font-display uppercase hover:underline focus-visible:outline-2 focus-visible:outline-accent-bright">{lookup(id)?.name ?? id}</Link>
      {other && <span className="block truncate text-xs text-text-secondary">vs {lookup(other)?.name ?? other}</span>}
    </span>
  );
}

export function ShameCard({ c, tilt }: { c: ShameCategory; tilt: number }) {
  const [top, ...rest] = c.entries;
  if (!top) return null;
  return (
    <article aria-labelledby={`shame-${c.id}`} className="stage relative isolate overflow-hidden rounded-card p-4 shadow-[inset_0_3px_0_var(--color-accent-bright)]">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(-45deg,transparent_0_18px,rgb(255_77_99/0.035)_18px_20px)]" />
      <p className="kicker m-0 text-accent-bright">Wanted for</p>
      <h3 id={`shame-${c.id}`} className="m-0 font-gothic text-2xl leading-tight">{c.title}</h3>
      <p className="m-0 mt-1 text-sm text-text-secondary italic">{c.quip}</p>
      <div className="mt-4 flex items-center gap-4">
        <span className="relative shrink-0" style={{ transform: `rotate(${tilt}deg)` }}>
          <IdolPhoto idolId={top.ids[0]!} size={256} className="photo-frame w-24 contrast-125 grayscale sepia-[.35]" />
          <span aria-hidden="true" className="absolute -right-3 bottom-3 -rotate-12 border-2 border-accent-bright bg-bg-base px-1.5 font-gothic text-sm tracking-widest text-accent-bright shadow-[0_0_12px_rgb(255_77_99/0.5)]">SHAME</span>
        </span>
        <span className="min-w-0 flex-1">
          <Who ids={top.ids} />
          <span className="score mt-1 block text-lg text-accent-bright">{top.value}</span>
        </span>
      </div>
      {rest.length > 0 && (
        <ol start={2} className="m-0 mt-4 list-none space-y-1 border-t border-border p-0 pt-3">
          {rest.map((e, i) => (
            <li key={e.ids.join("|")} className="flex items-center gap-3 text-sm">
              <span className="score w-5 text-text-secondary">{i + 2}</span>
              <IdolPhoto idolId={e.ids[0]!} size={64} className="h-8 w-6 shrink-0 rounded-[3px] grayscale" />
              <span className="min-w-0 flex-1"><Who ids={e.ids} /></span>
              <span className="shrink-0 text-right font-mono text-xs text-text-secondary">{e.value}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
