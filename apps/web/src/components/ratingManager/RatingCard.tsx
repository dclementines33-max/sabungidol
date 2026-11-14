// One idol in the Rating Manager, styled like the app's idol cards (Update 4: the old one read as an admin form):
// framed portrait, a tier-coloured edge, the draft rating big in blackletter (old → new when changed), a slider in the
// tier colour, steps −5 −3 −1 +1 +3 +5, quick values, and the career record + titles.
import type { IdolRow } from "@sabung/db";
import { type Tier, tierOf } from "@sabung/shared";
import { IdolPhoto, TIER_FILL } from "@sabung/ui";
import { useState } from "react";

const QUICK = [95, 88, 80, 70];
const STEPS = [-5, -3, -1, 1, 3, 5];
const EDGE: Record<Tier, string> = { S: "border-tier-s", A: "border-tier-a", B: "border-tier-b", C: "border-tier-c", D: "border-tier-d" };
const CHIP = "px-2 py-1 font-mono text-xs tabular-nums hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright";
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
    <li className={`flex gap-3 border-l-4 ${EDGE[tier]} bg-gradient-to-r from-surface/90 to-surface/30 p-3 ${changed ? "shadow-[inset_0_0_0_9999px_rgb(245_196_81/0.05)]" : ""}`}>
      <div className="photo-frame h-fit shrink-0"><IdolPhoto idolId={idol.id} size={256} className="w-20" /></div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="kicker m-0 truncate text-text-secondary">{idol.groupName ?? "Soloist"}{league ? ` · ${league}` : ""}</p>
            <p className="m-0 truncate font-display text-lg uppercase leading-tight">{idol.name}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className={`m-0 font-gothic text-2xl leading-none tabular-nums ${changed ? "text-brand-gold" : ""}`}>{shown}</p>
            <span className={`${TIER_FILL[tier]} mt-0.5 px-1.5 text-[10px] font-extrabold tracking-widest`}>{tier}</span>
          </div>
        </div>
        {changed && <p className="m-0 -mt-1 text-right font-mono text-[11px] text-text-secondary">from {idol.rating} ({value > idol.rating ? "+" : ""}{value - idol.rating})</p>}
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={100} value={shown} aria-label={`Slider rating ${idol.name}`} className="min-w-0 flex-1" style={{ accentColor: `var(--color-tier-${tier.toLowerCase()})` }}
            onChange={(e) => setSlide(Number(e.target.value))} onPointerUp={() => slide !== null && set(slide)} onKeyUp={() => slide !== null && set(slide)} onBlur={() => slide !== null && set(slide)} />
          <input type="number" min={1} max={100} aria-label={`New rating for ${idol.name}`} value={value}
            className="w-12 border-0 border-b-2 border-border-strong bg-transparent px-1 font-mono tabular-nums text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright"
            onChange={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 1 && v <= 100) set(v); }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-y-1">
          <div role="group" aria-label={`Change ${idol.name}'s rating`} className="flex bg-bg-base/50">
            {STEPS.map((s) => (
              <button key={s} type="button" aria-label={`${idol.name} ${s > 0 ? "+" : "−"}${Math.abs(s)}`} onClick={() => set(value + s)}
                className={`${CHIP} ${s > 0 ? "text-cool" : "text-accent-bright"}`}>{s > 0 ? "+" : "−"}{Math.abs(s)}</button>
            ))}
          </div>
          <div className="flex">
            {QUICK.map((q) => <button key={q} type="button" aria-label={`Set ${idol.name} to ${q}`} className={`${CHIP} text-text-secondary`} onClick={() => set(q)}>{q}</button>)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs text-text-secondary">
          <span className="font-mono">{line ? `${line.wins}M-${line.draws}S-${line.losses}K · ${Math.round(line.winRate * 100)}%` : "No games yet"}</span>
          <span>{line?.titles ?? 0} titles</span>
          <label className="flex cursor-pointer items-center gap-1"><input type="checkbox" aria-label={`Select ${idol.name}`} checked={selected} onChange={(e) => onSelect(e.target.checked)} />Select</label>
        </div>
      </div>
    </li>
  );
}
