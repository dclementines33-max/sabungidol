// The Idol Database as a virtual table (PRD §8): photo, name, group, rating, league, status.
import type { IdolRow } from "@sabung/db";
import { IdolPhoto, RatingBadge, VirtualTable } from "@sabung/ui";

export function IdolDatabaseTable({ idols, leagueOf }: { idols: IdolRow[]; leagueOf: Map<string, string> }) {
  return (
    <VirtualTable
      rows={idols}
      rowKey={(i) => i.id}
      label="Tabel idol"
      columns={[
        { header: "Foto", cell: (i) => <IdolPhoto idolId={i.id} size={64} className="w-8" />, className: "w-14" },
        { header: "Nama", cell: (i) => i.name, className: "font-medium" },
        { header: "Group", cell: (i) => i.groupName ?? "Soloist", className: "text-text-secondary" },
        { header: "Rating", cell: (i) => <RatingBadge rating={i.rating} /> },
        { header: "Liga", cell: (i) => leagueOf.get(i.id) ?? "Cadangan", className: "font-mono" },
        { header: "Status", cell: (i) => (i.active ? "Aktif" : "Nonaktif"), className: "text-text-secondary" },
      ]}
    />
  );
}
