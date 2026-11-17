// One Dashboard block (PRD §8; Update 2: no outlines): design round 2 = a fight-card panel with a slab title, flowing in columns.
import type { ReactNode } from "react";
import { SectionBoundary } from "../SectionBoundary";

export function DashboardCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="panel mb-6 break-inside-avoid p-5">
      <h2 className="section-title mb-4 text-base">{title}</h2>
      <SectionBoundary name={title}>{children}</SectionBoundary>
    </section>
  );
}
