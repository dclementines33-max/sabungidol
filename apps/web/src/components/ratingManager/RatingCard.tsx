// One idol in the Rating Manager (Update 3 ref "rating manager cards"): photo, name, tier + the draft rating,
// a slider (applied when let go), a number field, −5 / +5, quick values, and the career record + titles.
import type { IdolRow } from "@sabung/db";
import { tierOf } from "@sabung/shared";
import { IdolPhoto, TIER_FILL } from "@sabung/ui";
import { useState } from "react";

const QUICK = [95, 88, 80, 70];
const CHIP = "bg-surface-hover/70 px-2 py-1 font-mono text-xs hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright";
export type CareerLine = { wins: number; draws: number; losses: number; winRate: number; titles: number };

export function RatingCard({ idol, league, value, line, selected, onSelect, onSet }: {
  idol: IdolRow;
  league?: string;
  value: number; // the draft rating (the saved one when unchanged)
  line?: CareerLine;
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
    <li className={`flex flex-col gap-3 p-3 ${changed ? "bg-surface-hover/60" : "bg-surface/70"}`}>
      <div className="flex items-center gap-3">
        <IdolPhoto idolId={idol.id} size={64} className="w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-display">{idol.name}</p>
          <p className="m-0 truncate text-xs text-text-secondary">{idol.groupName ?? "Soloist"}{league ? ` · ${league}` : ""}</p>
        </div>
        <div className="text-right">
          <span className={`${TIER_FILL[tier]} px-1.5 text-[10px] font-extrabold`}>{tier}</span>
          <p className={`m-0 font-display text-2xl leading-none tabular-nums ${changed ? "text-brand-gold" : ""}`}>{shown}</p>
          {changed && <p className="m-0 font-mono text-[10px] text-text-secondary">dari {idol.rating}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input type="range" min={1} max={100} value={shown} aria-label={`Slider rating ${idol.name}`} className="flex-1 accent-[var(--color-accent-bright)]"
          onChange={(e) => setSlide(Number(e.target.value))} onPointerUp={() => slide !== null && set(slide)} onKeyUp={() => slide !== null && set(slide)} onBlur={() => slide !== null && set(slide)} />
        <input type="number" min={1} max={100} aria-label={`Rating baru ${idol.name}`} value={value}
          className="w-14 border-0 border-b-2 border-border-strong bg-bg-base/60 px-1 py-1 font-mono tabular-nums text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright"
          onChange={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 1 && v <= 100) set(v); }} />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" aria-label={`${idol.name} −5`} className={CHIP} onClick={() => set(value - 5)}>−5</button>
        <button type="button" aria-label={`${idol.name} +5`} className={CHIP} onClick={() => set(value + 5)}>+5</button>
        <span className="flex-1" />
        {QUICK.map((q) => <button key={q} type="button" aria-label={`Set ${idol.name} ke ${q}`} className={CHIP} onClick={() => set(q)}>{q}</button>)}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="font-mono">{line ? `${line.wins}M-${line.draws}S-${line.losses}K (${Math.round(line.winRate * 100)}%)` : "Belum main"}</span>
        <span>{line?.titles ?? 0} gelar</span>
        <label className="flex items-center gap-1"><input type="checkbox" aria-label={`Pilih ${idol.name}`} checked={selected} onChange={(e) => onSelect(e.target.checked)} />Pilih</label>
      </div>
    </li>
  );
}
