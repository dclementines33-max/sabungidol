// One tier on the board: the coloured label block (click the name to rename, the dot to recolour), the drop lane with its
// items, and the row tools (up, down, delete). The lane lights up while something is dragged over it or picked up.
import { ArrowDown, ArrowUp, Trash } from "@sabung/ui/icons";
import { type HTMLAttributes, type ReactNode, useState } from "react";
import type { TierRow } from "../../data/userLists";
import { COLORS } from "./tierOps";

const tool = "grid size-7 place-items-center rounded-control text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright disabled:opacity-25";

export function TierRowView({ tier, count, over, armed, first, last, onPlace, onRename, onColor, onMove, onRemove, children }: {
  tier: TierRow; count: number; over: boolean; armed: boolean; first: boolean; last: boolean; onPlace: () => void;
  onRename: (label: string) => void; onColor: (color: string) => void; onMove: (step: -1 | 1) => void; onRemove: () => void; children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [painting, setPainting] = useState(false);
  const lane: HTMLAttributes<HTMLDivElement> = armed ? { onClick: onPlace } : {}; // the explicit button below serves keyboards
  const size = tier.label.length <= 2 ? "text-3xl sm:text-4xl" : tier.label.length <= 5 ? "text-base sm:text-xl" : "text-xs sm:text-sm";
  return (
    <li className="group/row relative flex min-h-[5.5rem] items-stretch gap-0 sm:min-h-24">
      <div className="relative flex w-16 shrink-0 flex-col items-center justify-center gap-1 px-1 py-2 text-on-fill [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)] sm:w-28" style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${tier.color} 80%, white), ${tier.color} 55%, color-mix(in oklab, ${tier.color} 60%, black))` }}>
        {editing ? (
          <input
            autoFocus defaultValue={tier.label} maxLength={24} aria-label="Tier name"
            className="w-full rounded-[3px] bg-bg-base/80 px-1 py-0.5 text-center text-sm font-bold text-text-primary"
            onBlur={(e) => { onRename(e.target.value.trim() || tier.label); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditing(false); }}
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} aria-label={`Rename tier ${tier.label}`} className={`w-full break-words text-center font-gothic leading-none hover:underline focus-visible:outline-2 focus-visible:outline-bg-base ${size}`}>{tier.label}</button>
        )}
        <span className="font-mono text-[10px] opacity-70">{count}</span>
        <button type="button" onClick={() => setPainting(!painting)} aria-label={`Colour of ${tier.label}`} aria-expanded={painting} className="absolute top-1 left-1 size-3.5 rounded-full bg-bg-base/40 ring-1 ring-bg-base/60 hover:scale-125 focus-visible:outline-2 focus-visible:outline-bg-base" />
      </div>
      {painting && (
        <div role="group" aria-label="Pick a colour" className="stage absolute top-full left-0 z-30 mt-1 grid w-56 grid-cols-5 gap-1.5 rounded-card p-2">
          {COLORS.map((c) => <button key={c} type="button" aria-label={`Colour ${c.replace(/var\(--color-|\)/g, "")}`} aria-pressed={c === tier.color} onClick={() => { onColor(c); setPainting(false); }} className={`h-6 -skew-x-12 rounded-[2px] focus-visible:outline-2 focus-visible:outline-accent-bright ${c === tier.color ? "ring-2 ring-text-primary" : ""}`} style={{ background: c }} />)}
        </div>
      )}
      <div
        data-drop={tier.id} {...lane}
        className={`flex min-w-0 flex-1 flex-wrap content-start items-start gap-1.5 p-1.5 sm:gap-2 sm:p-2 transition-colors ${over ? "bg-accent/30 shadow-[inset_0_0_0_2px_var(--color-accent-bright)]" : armed ? "cursor-pointer bg-stage-hi/80 hover:bg-accent/20" : "bg-stage-hi/50"}`}
      >
        {children}
        {armed && <button type="button" onClick={(e) => { e.stopPropagation(); onPlace(); }} className="chip self-center bg-accent py-1.5 text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright"><span>Place in {tier.label}</span></button>}
        {count === 0 && !armed && <span className="pointer-events-none self-center pl-2 text-xs text-text-secondary/60">Drop here</span>}
      </div>
      <div className="flex w-8 shrink-0 flex-col items-center justify-center bg-stage-hi/30">
        <button type="button" className={tool} aria-label={`Move ${tier.label} up`} disabled={first} onClick={() => onMove(-1)}><ArrowUp size={14} /></button>
        <button type="button" className={tool} aria-label={`Move ${tier.label} down`} disabled={last} onClick={() => onMove(1)}><ArrowDown size={14} /></button>
        <button type="button" className={tool} aria-label={`Delete tier ${tier.label}`} onClick={onRemove}><Trash size={14} /></button>
      </div>
    </li>
  );
}
