// Places 4–10 of the Sabung Index under the podium: fight-card rows with the place, the photo, the name, where the points
// come from (stacked bar) and the score.
import { EntryFace } from "./EntryFace";
import { EntryLink } from "./EntryLink";
import { IndexBar, describeParts } from "./IndexBar";
import type { IndexRow } from "./sabungIndex";
import type { Entry } from "./useEntries";

export function RankBoard({ rows, from, max }: { rows: { entry: Entry; row: IndexRow }[]; from: number; max: number }) {
  return (
    <ol start={from} className="m-0 list-none space-y-2 p-0">
      {rows.map(({ entry, row }, k) => (
        <li key={entry.id} className="panel flex animate-rise flex-wrap items-center gap-x-3 gap-y-1.5 p-2 pr-4" style={{ animationDelay: `${700 + k * 60}ms` }}>
          <span className="score w-9 shrink-0 text-center text-2xl text-text-secondary sm:w-11">{from + k}</span>
          <EntryFace entry={entry} logo="size-5" className="photo-frame w-12 sm:w-14" />
          <span className="min-w-0 flex-1">
            <EntryLink entry={entry} className="block truncate font-display text-lg" />
            <span className="kicker block truncate text-text-secondary">{entry.sub}</span>
          </span>
          <span className="order-last basis-full sm:order-none sm:basis-64"><IndexBar parts={row.parts} max={max} /></span>
          <span className="score w-14 shrink-0 text-right text-xl text-accent-bright" title={describeParts(row.parts)}>{row.score.toFixed(1)}</span>
        </li>
      ))}
    </ol>
  );
}
