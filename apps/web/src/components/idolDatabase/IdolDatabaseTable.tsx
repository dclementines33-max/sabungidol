// The Idol Database as a virtual table (PRD §8): photo, name, group, rating, league, status.
import type { IdolRow } from "@sabung/db";
import { IdolPhoto, RatingBadge, VirtualTable } from "@sabung/ui";

export function IdolDatabaseTable({ idols, leagueOf }: { idols: IdolRow[]; leagueOf: Map<string, string> }) {
  return (
    <VirtualTable
      rows={idols}
      rowKey={(i) => i.id}
      label="Idol table"
      columns={[
        { header: "Photo", cell: (i) => <IdolPhoto idolId={i.id} size={64} className="w-8" />, className: "w-14" },
        { header: "Name", cell: (i) => i.name, className: "font-medium" },
        { header: "Group", cell: (i) => i.groupName ?? "Soloist", className: "text-text-secondary" },
        { header: "Rating", cell: (i) => <RatingBadge rating={i.rating} /> },
        { header: "League", cell: (i) => leagueOf.get(i.id) ?? "Reserve", className: "font-mono" },
        { header: "Status", cell: (i) => (i.active ? "Active" : "Inactive"), className: "text-text-secondary" },
      ]}
    />
  );
}
