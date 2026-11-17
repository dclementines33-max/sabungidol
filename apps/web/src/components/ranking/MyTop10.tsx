// My Top 10 (Ranking, 2026-11-17): the user's own order of idols or girl groups. Add from the picker, drag a row (or use
// the arrows) to reorder, start from the Sabung Index if a blank page is too much. The top three stand on the podium.
import { Button, ConfirmDialog, SearchableIdolSelect } from "@sabung/ui";
import { ArrowDown, ArrowUp, Grip, Sparkles, Trash } from "@sabung/ui/icons";
import { useState } from "react";
import { type Kind, useUserLists } from "../../data/userLists";
import { usePointerDrag } from "../dnd/usePointerDrag";
import { Select } from "../idolDatabase/IdolFilters";
import { EntryFace } from "./EntryFace";
import { EntryLink } from "./EntryLink";
import { RankPodium } from "./RankPodium";
import type { Entry } from "./useEntries";

export const moveTo = (ids: string[], id: string, index: number) => {
  const from = ids.indexOf(id);
  const rest = ids.filter((x) => x !== id);
  rest.splice(from >= 0 && from < index ? index - 1 : index, 0, id);
  return rest;
};

const iconButton = "grid size-7 place-items-center sm:size-8 rounded-control text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright disabled:opacity-30";

export function MyTop10({ kind, entries, suggested }: { kind: Kind; entries: { list: Entry[]; byId: Map<string, Entry> }; suggested: string[] }) {
  const ids = useUserLists((s) => s.top10[kind]).filter((id) => entries.byId.has(id));
  const setTop10 = useUserLists((s) => s.setTop10);
  const save = (next: string[]) => setTop10(kind, next);
  const [clearing, setClearing] = useState(false);
  const { drag, bind } = usePointerDrag((id, target, index) => { if (target === "top10" && index !== null) save(moveTo(ids, id, index)); });
  const free = entries.list.filter((e) => !ids.includes(e.id));
  const add = (id: string | null) => { if (id && !ids.includes(id)) save([...ids, id]); };
  const noun = kind === "idol" ? "idol" : "group";
  const ghost = drag && entries.byId.get(drag.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 mr-auto max-w-prose text-text-secondary">Your order, nobody else's. Drag a row (hold it on a phone) or use the arrows. Saved in this browser.</p>
        {ids.length < 10 && <Button variant="primary" onClick={() => save([...ids, ...suggested.filter((id) => !ids.includes(id))].slice(0, 10))}><Sparkles size={16} />Fill from the Sabung Index</Button>}
        {ids.length > 0 && <Button onClick={() => setClearing(true)}><Trash size={16} />Clear</Button>}
      </div>
      {ids.length >= 3 && <RankPodium spots={ids.slice(0, 3).map((id) => ({ entry: entries.byId.get(id)! }))} caption={`Your top three ${noun === "idol" ? "idols" : "girl groups"}`} />}
      <ol data-drop="top10" data-drop-axis="y" aria-label={`My top 10 ${noun}s`} className="m-0 list-none space-y-2 p-0">
        {ids.map((id, k) => {
          const e = entries.byId.get(id)!;
          return (
            <li
              key={id} data-drag-index={k} {...bind(id)}
              className={`panel flex touch-manipulation items-center gap-2 p-2 pr-2 sm:gap-3 sm:pr-3 select-none [-webkit-touch-callout:none] ${drag?.id === id ? "opacity-30" : ""} ${k < 3 ? "winner" : ""}`}
            >
              <Grip size={18} className="hidden shrink-0 cursor-grab text-text-secondary sm:block" />
              <span className={`score w-7 shrink-0 sm:w-9 text-center text-2xl ${k === 0 ? "text-winner" : "text-text-secondary"}`}>{k + 1}</span>
              <EntryFace entry={e} logo="size-5" className="photo-frame pointer-events-none w-11" />
              <span className="min-w-0 flex-1">
                <EntryLink entry={e} className="block truncate font-display text-lg" />
                <span className="kicker block truncate text-text-secondary">{e.sub}</span>
              </span>
              <span className="flex shrink-0 flex-col sm:flex-row">
              <button type="button" className={iconButton} aria-label={`Move ${e.name} up`} disabled={k === 0} onClick={() => save(moveTo(ids, id, k - 1))}><ArrowUp size={16} /></button>
              <button type="button" className={iconButton} aria-label={`Move ${e.name} down`} disabled={k === ids.length - 1} onClick={() => save(moveTo(ids, id, k + 2))}><ArrowDown size={16} /></button>
              </span>
              <button type="button" className={iconButton} aria-label={`Remove ${e.name}`} onClick={() => save(ids.filter((x) => x !== id))}><Trash size={16} /></button>
            </li>
          );
        })}
        {Array.from({ length: 10 - ids.length }, (_, k) => (
          <li key={`empty-${k}`} aria-hidden="true" className="flex items-center gap-3 rounded-card bg-stage-hi/40 p-2 pl-10 text-text-secondary">
            <span className="score w-9 text-center text-2xl opacity-40">{ids.length + k + 1}</span>
            <span className="kicker opacity-60">Empty spot</span>
          </li>
        ))}
      </ol>
      {ids.length < 10 && (
        <div className="max-w-md">
          {kind === "idol"
            ? <SearchableIdolSelect key={ids.length} label={`Add #${ids.length + 1}`} idolIds={free.map((e) => e.id)} value={null} onChange={add} />
            : <Select label={`Add #${ids.length + 1}`} value="" onChange={add} options={[["", "Pick a girl group…"], ...free.map((e): [string, string] => [e.id, e.name])]} />}
        </div>
      )}
      {ghost && drag && (
        <div aria-hidden="true" className="pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-1/2 -rotate-3 items-center gap-2 rounded-card bg-stage-hi p-2 pr-4 shadow-[0_20px_50px_-10px_var(--color-accent-bright)]" style={{ left: drag.x, top: drag.y }}>
          <EntryFace entry={ghost} logo="size-5" className="photo-frame w-10" /><span className="font-display">{ghost.name}</span>
        </div>
      )}
      <ConfirmDialog open={clearing} onOpenChange={setClearing} title="Clear My Top 10?" message={`All ${ids.length} ${noun}s leave your list. The Sabung Index is not touched.`} confirmLabel="Clear" danger onConfirm={() => { save([]); setClearing(false); }} />
    </div>
  );
}
