// One column of the Inactive Manager: search, tick idols, act on the ticked ones, or drag them
// to the other column (drag is a shortcut; the button does the same with a keyboard).
import type { IdolRow } from "@sabung/db";
import { Button, IdolPhoto, RatingBadge } from "@sabung/ui";
import { type DragEvent, useMemo, useState } from "react";

export function IdolColumn({ title, idols, selected, onToggle, actionLabel, onMove }: {
  title: string;
  idols: IdolRow[];
  selected: Set<string>;
  onToggle: (ids: string[], on: boolean) => void;
  actionLabel: string;
  onMove: (ids: string[]) => void; // ids dropped here from the other column, or ticked here and acted on
}) {
  const [search, setSearch] = useState("");
  const [over, setOver] = useState(false);
  const shown = useMemo(() => idols.filter((i) => `${i.name} ${i.groupName ?? "soloist"}`.toLowerCase().includes(search.trim().toLowerCase())), [idols, search]);
  const ticked = idols.filter((i) => selected.has(i.id)).map((i) => i.id);
  const drag = (event: DragEvent, id: string) => event.dataTransfer.setData("text/plain", JSON.stringify(selected.has(id) ? ticked : [id]));
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    const ids: string[] = JSON.parse(event.dataTransfer.getData("text/plain") || "[]");
    const fromOther = ids.filter((id) => !idols.some((i) => i.id === id));
    if (fromOther.length) onMove(fromOther);
  };
  return (
    <section
      aria-label={title}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={`${over ? "shadow-[0_0_0_2px_var(--color-accent-bright),0_0_40px_-10px_var(--color-accent-bright)]" : ""} panel flex min-w-0 flex-1 flex-col gap-3 p-4`}
    >
      <h2 className="section-title text-lg">{title} <span className="font-mono text-sm text-text-secondary">({idols.length})</span></h2>
      <input type="search" aria-label={`Search ${title}`} placeholder="Name or group…" value={search} onChange={(e) => setSearch(e.target.value)}
        className="rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright" />
      <div className="flex flex-wrap items-center gap-2">
        <Button className="px-2 py-1" onClick={() => onToggle(shown.map((i) => i.id), true)}>Select all shown</Button>
        <Button variant={ticked.length ? "primary" : "secondary"} className="px-2 py-1" disabled={!ticked.length} onClick={() => onMove(ticked)}>
          {actionLabel} ({ticked.length})
        </Button>
      </div>
      <ul className="m-0 max-h-[60vh] list-none space-y-1 overflow-auto p-0">
        {shown.map((i) => (
          <li key={i.id} draggable onDragStart={(e) => drag(e, i.id)} className="flex items-center gap-3 rounded-control px-2 py-1 hover:bg-surface-hover">
            <input type="checkbox" checked={selected.has(i.id)} onChange={(e) => onToggle([i.id], e.target.checked)} aria-label={`Select ${i.name}`} className="size-4 accent-accent-bright" />
            <IdolPhoto idolId={i.id} size={64} className="w-8" />
            <span className="min-w-0 flex-1 truncate">{i.name}<span className="text-sm text-text-secondary"> · {i.groupName ?? "Soloist"}</span></span>
            <RatingBadge rating={i.rating} />
          </li>
        ))}
      </ul>
    </section>
  );
}
