// Tabs for the competition panels (PRD §8): a WAI-ARIA tablist; arrow keys move between tabs.
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
  const current = tabs.find((t) => t.id === active)!;
  return (
    <div>
      <div role="tablist" aria-label={label} className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t, i) => (
          <button key={t.id} id={`${base}-${t.id}`} type="button" role="tab" aria-selected={t.id === active} aria-controls={`${base}-panel`} tabIndex={t.id === active ? 0 : -1}
            onClick={() => setActive(t.id)} onKeyDown={(e) => move(e, i)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent-bright ${t.id === active ? "border-accent-bright text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${active}`}>{current.content()}</div>
    </div>
  );
}
