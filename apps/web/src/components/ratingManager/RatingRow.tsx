// One idol in the Rating Manager (rebuilt 2026-11-15: the cards read as too busy): a single calm row — photo (click for a
// large viewer with her gallery and the same rating controls), name with group · league as meta, the slider, a number
// field, the tier chip, select. A changed rating shows in gold with "was N"; no record, no step buttons.
import type { IdolRow } from "@sabung/db";
import { IdolPhoto, PhotoLightbox, useIdolLookup } from "@sabung/ui";
import { useState } from "react";
import { RatingControls } from "./RatingControls";

export function RatingRow({ idol, league, value, selected, onSelect, onSet }: {
  idol: IdolRow;
  league?: string;
  value: number; // the draft rating (the saved one when unchanged)
  selected: boolean;
  onSelect: (on: boolean) => void;
  onSet: (rating: number) => void;
}) {
  const [viewing, setViewing] = useState<number | null>(null); // photo index in the viewer: 0 = main photo
  const gallery = useIdolLookup()(idol.id)?.gallery ?? [];
  return (
    <li className={`mb-1 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[4px] px-3 py-2 ${selected ? "bg-surface-hover/80 shadow-[inset_3px_0_0_var(--color-accent-bright)]" : "bg-stage-hi/40"}`}>
      <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
        <input type="checkbox" aria-label={`Select ${idol.name}`} checked={selected} onChange={(e) => onSelect(e.target.checked)} />
        <button type="button" aria-label={`Large photo of ${idol.name}`} className="shrink-0 focus-visible:outline-2 focus-visible:outline-accent-bright" onClick={() => setViewing(0)}>
          <IdolPhoto idolId={idol.id} size={64} className="w-9" />
        </button>
        <span className="min-w-0">
          <span className="block truncate font-display uppercase">{idol.name}</span>
          <span className="block truncate text-xs text-text-secondary">{idol.groupName ?? "Soloist"}{league ? ` · ${league}` : ""}</span>
        </span>
      </div>
      <RatingControls idol={idol} value={value} onSet={onSet} />
      {viewing !== null && (
        <PhotoLightbox main={idol.id} photos={gallery} index={viewing} name={`${idol.name} · ${idol.groupName ?? "Soloist"}`} onIndex={setViewing} onClose={() => setViewing(null)}>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"><RatingControls idol={idol} value={value} onSet={onSet} /></div>
        </PhotoLightbox>
      )}
    </li>
  );
}
