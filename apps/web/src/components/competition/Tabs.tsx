// Tabs for the competition panels (PRD §8): a WAI-ARIA tablist; arrow keys move between tabs. Design round 2: skewed
// fight-card chips, the open one filled crimson.
import { type KeyboardEvent, type ReactNode, useId, useState } from "react";

export function Tabs({ label, tabs }: { label: string; tabs: { id: string; label: string; content: () => ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]!.id);
  const base = useId();
  const move = (event: KeyboardEvent, i: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length]!;
    setActive(next.id);
    document.getElementById(`${base}-${next.id}`)?.focus();
  };
  const current = tabs.find((t) => t.id === active) ?? tabs[0]!; // the active tab can drop out when the list changes
  return (
    <div>
      <div role="tablist" aria-label={label} className="mb-5 flex gap-1.5 overflow-x-auto px-1 py-1">
        {tabs.map((t, i) => (
          <button key={t.id} id={`${base}-${t.id}`} type="button" role="tab" aria-selected={t.id === current.id} aria-controls={`${base}-panel`} tabIndex={t.id === current.id ? 0 : -1}
            onClick={() => setActive(t.id)} onKeyDown={(e) => move(e, i)}
            className={`shrink-0 -skew-x-12 whitespace-nowrap rounded-[3px] px-4 py-1.5 text-xs font-bold tracking-[0.12em] uppercase [font-stretch:115%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright ${t.id === current.id ? "bg-accent text-on-accent shadow-[0_8px_24px_-10px_var(--color-accent-bright),inset_0_-2px_0_var(--color-accent-bright)]" : "bg-stage-hi/70 text-text-secondary hover:bg-surface-hover hover:text-text-primary"}`}>
            <span className="inline-block skew-x-12">{t.label}</span>
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${current.id}`}>{current.content()}</div>
    </div>
  );
}
