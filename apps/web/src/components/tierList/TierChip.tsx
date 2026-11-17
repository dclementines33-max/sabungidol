// One idol or girl group on the tier board or in the pool: a small trading-card face with the name. Tap to pick it up
// (then tap a tier), or drag it straight there.
import type { HTMLAttributes } from "react";
import { EntryFace } from "../ranking/EntryFace";
import type { Entry } from "../ranking/useEntries";

export function TierChip({ entry, index, selected, faded, onSelect, drag }: {
  entry: Entry; index: number; selected: boolean; faded: boolean; onSelect: () => void; drag: HTMLAttributes<HTMLElement>;
}) {
  return (
    <button
      type="button" data-drag-index={index} {...drag}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      aria-pressed={selected} aria-label={`${entry.name} · ${entry.sub}`} title={`${entry.name} · ${entry.sub}`}
      className={`relative w-11 shrink-0 cursor-grab touch-manipulation rounded-[4px] text-left transition-[transform,opacity] select-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright sm:w-[4.5rem] ${faded ? "opacity-25" : ""} ${selected ? "z-10 -translate-y-1 scale-105 outline-2 outline-offset-2 outline-accent-bright shadow-[0_12px_30px_-8px_var(--color-accent-bright)]" : "hover:-translate-y-0.5"}`}
    >
      <span aria-hidden="true" className="pointer-events-none block"><EntryFace entry={entry} logo="size-4" className="w-full" /></span>
      <span className="mt-0.5 block truncate text-[9px] leading-tight font-bold tracking-wide uppercase sm:text-[11px]">{entry.name}</span>
    </button>
  );
}
