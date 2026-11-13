// One Dashboard card (PRD §8): a titled box in the fixed card grid (user decision: fixed order, no drag).
import type { ReactNode } from "react";

export function DashboardCard({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section aria-label={title} className={`panel p-4 ${wide ? "md:col-span-2" : ""}`}>
      <h2 className="m-0 mb-3 text-xs tracking-widest text-text-secondary uppercase">{title}</h2>
      {children}
    </section>
  );
}
