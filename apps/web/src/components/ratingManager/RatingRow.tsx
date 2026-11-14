// One idol in the Rating Manager (rebuilt 2026-11-15: the cards read as too busy): a single calm row — photo, name with
// group · league as meta, the slider (commits on release), a number field, the tier chip, select. A changed rating shows
// in gold with "was N"; no record, no step buttons.
import type { IdolRow } from "@sabung/db";
import { tierOf } from "@sabung/shared";
import { IdolPhoto, TIER_FILL } from "@sabung/ui";
import { useState } from "react";

export function RatingRow({ idol, league, value, selected, onSelect, onSet }: {
  idol: IdolRow;
  league?: string;
  value: number; // the draft rating (the saved one when unchanged)
  selected: boolean;
  onSelect: (on: boolean) => void;
  onSet: (rating: number) => void;
}) {
  const [slide, setSlide] = useState<number | null>(null); // while dragging; committed on release
  const shown = slide ?? value;
  const set = (v: number) => { setSlide(null); if (v !== value) onSet(Math.max(1, Math.min(100, v))); };
  const tier = tierOf(shown);
  const changed = value !== idol.rating;
  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-2 py-2 ${selected ? "bg-surface/60" : ""}`}>
      <label className="flex min-w-0 flex-1 basis-56 cursor-pointer items-center gap-3">
        <input type="checkbox" aria-label={`Select ${idol.name}`} checked={selected} onChange={(e) => onSelect(e.target.checked)} />
        <IdolPhoto idolId={idol.id} size={64} className="w-9 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate font-display">{idol.name}</span>
          <span className="block truncate text-xs text-text-secondary">{idol.groupName ?? "Soloist"}{league ? ` · ${league}` : ""}</span>
        </span>
      </label>
      <input type="range" min={1} max={100} value={shown} aria-label={`Slider rating ${idol.name}`} className="min-w-32 flex-[2] accent-[var(--color-accent-bright)]"
        onChange={(e) => setSlide(Number(e.target.value))} onPointerUp={() => slide !== null && set(slide)} onKeyUp={() => slide !== null && set(slide)} onBlur={() => slide !== null && set(slide)} />
      <span className="flex items-center gap-2">
        <input type="number" min={1} max={100} aria-label={`New rating for ${idol.name}`} value={value}
          className={`w-14 border-0 border-b-2 border-border-strong bg-transparent px-1 text-right font-mono tabular-nums focus-visible:outline-2 focus-visible:outline-accent-bright ${changed ? "text-brand-gold" : "text-text-primary"}`}
          onChange={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 1 && v <= 100) set(v); }} />
        <span className={`${TIER_FILL[tier]} w-7 text-center text-[10px] font-extrabold`}>{tier}</span>
        <span className="w-12 font-mono text-[11px] text-text-secondary">{changed ? `was ${idol.rating}` : ""}</span>
      </span>
    </li>
  );
}
