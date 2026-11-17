// The pool under the tier board: everyone not placed yet, with a search and (idols) a group filter. It sticks to the
// bottom of the screen (beside the board from the md breakpoint, 1024 px) so it stays in reach while the board scrolls; it folds away.
import { ChevronLeft, Search } from "@sabung/ui/icons";
import { type ReactNode, useState } from "react";
import { Select } from "../idolDatabase/IdolFilters";
import type { Entry } from "../ranking/useEntries";

export function TierPool({ items, total, over, armed, onPlace, groupOptions, render }: {
  items: Entry[]; total: number; over: boolean; armed: boolean; onPlace: () => void;
  groupOptions: [string, string][] | null; render: (shown: Entry[]) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [open, setOpen] = useState(true);
  const q = query.trim().toLowerCase();
  const shown = items.filter((e) => (!q || `${e.name} ${e.sub}`.toLowerCase().includes(q)) && (!group || e.groupId === group));
  return (
    <section aria-label="Pool" className="stage sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-4 rounded-card p-3 shadow-[0_-20px_40px_-20px_rgb(1_0_3/0.9)] sm:bottom-2 md:top-4 md:bottom-auto md:mt-0">
      <div className="flex flex-wrap items-end gap-3">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent-bright">
          <ChevronLeft size={16} className={`transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
          <span className="font-display text-lg">Pool</span>
          <span className="chip bg-accent text-on-accent"><span>{items.length} of {total} left</span></span>
        </button>
        {open && (
          <>
            <label className="ml-auto flex min-w-40 flex-1 items-center gap-2 border-b-2 border-accent-bright/60 py-1 sm:max-w-64 md:max-w-none">
              <Search size={16} className="shrink-0" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a name…" aria-label="Find in the pool" className="w-full bg-transparent text-sm outline-none placeholder:text-text-secondary" />
            </label>
            {groupOptions && <div className="w-44 md:w-full"><Select label="Group" value={group} onChange={setGroup} options={[["", "All groups"], ...groupOptions]} /></div>}
          </>
        )}
      </div>
      {open && (
        <div
          data-drop="pool" onClick={armed ? onPlace : undefined}
          className={`mt-3 flex max-h-[26vh] flex-wrap content-start gap-2 overflow-y-auto overscroll-contain rounded-card p-2 transition-colors sm:max-h-[32vh] md:max-h-[calc(100dvh-12rem)] ${over ? "bg-accent/30 shadow-[inset_0_0_0_2px_var(--color-accent-bright)]" : armed ? "cursor-pointer bg-stage-hi/60" : ""}`}
        >
          {render(shown)}
          {armed && <button type="button" onClick={(e) => { e.stopPropagation(); onPlace(); }} className="chip self-center bg-stage-hi py-1.5"><span>Back to the pool</span></button>}
          {shown.length === 0 && !armed && <p className="m-0 p-2 text-sm text-text-secondary">{items.length ? "Nobody matches." : "Everyone is placed. Nice board."}</p>}
        </div>
      )}
    </section>
  );
}
