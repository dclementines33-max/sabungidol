// One Dashboard block (PRD §8; Update 2: no boxes): a title over a thin line, flowing in columns rather than a grid.
import type { ReactNode } from "react";

export function DashboardCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="mb-10 break-inside-avoid border-t border-border pt-3">
      <h2 className="kicker m-0 mb-3 text-accent-bright">{title}</h2>
      {children}
    </section>
  );
}
