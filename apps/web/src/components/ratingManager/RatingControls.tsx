// The rating slider (commits on release), the number field, the tier chip and "was N" for one idol; used in the
// Rating Manager row and in the large photo viewer, so both edit the same draft.
import type { IdolRow } from "@sabung/db";
import { tierOf } from "@sabung/shared";
import { TIER_FILL } from "@sabung/ui";
import { useState } from "react";

export function RatingControls({ idol, value, onSet }: { idol: IdolRow; value: number; onSet: (rating: number) => void }) {
  const [slide, setSlide] = useState<number | null>(null); // while dragging; committed on release
  const shown = slide ?? value;
  const set = (v: number) => { setSlide(null); if (v !== value) onSet(Math.max(1, Math.min(100, v))); };
  const tier = tierOf(shown);
  const changed = value !== idol.rating;
  return (
    <>
      <input type="range" min={1} max={100} value={shown} aria-label={`Slider rating ${idol.name}`} className="min-w-32 flex-[2] accent-[var(--color-accent-bright)]"
        onChange={(e) => setSlide(Number(e.target.value))} onPointerUp={() => slide !== null && set(slide)} onKeyUp={() => slide !== null && set(slide)} onBlur={() => slide !== null && set(slide)} />
      <span className="flex items-center gap-2">
        <input type="number" min={1} max={100} aria-label={`New rating for ${idol.name}`} value={value}
          className={`w-14 border-0 border-b-2 border-border-strong bg-transparent px-1 text-right font-mono tabular-nums focus-visible:outline-2 focus-visible:outline-accent-bright ${changed ? "text-brand-gold" : "text-text-primary"}`}
          onChange={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 1 && v <= 100) set(v); }} />
        <span className={`${TIER_FILL[tier]} w-7 text-center text-[10px] font-extrabold`}>{tier}</span>
        <span className="w-12 font-mono text-[11px] text-text-secondary">{changed ? `was ${idol.rating}` : ""}</span>
      </span>
    </>
  );
}
