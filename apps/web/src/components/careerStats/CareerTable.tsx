// One Career Stats tab (PRD §8 "spreadsheet legend"): every idol in scope for one competition key, the chosen
// columns (Update 2: chosen per format), a podium of the top three, photo + name sticky on the left, sorted, and CSV.
import { type CareerRow, careerOrder } from "@sabung/engine";
import { Button, IdolPhoto, VirtualTable, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download } from "lucide-react";
import { engine } from "../../data/engineClient";
import { CAREER_COLUMNS, columnsFor } from "../wiki/careerColumns";
import { IdolLink } from "../wiki/IdolLink";
import { careerCsv } from "./careerCsv";
import { ColumnPicker } from "./ColumnPicker";
import { Podium } from "./Podium";

export const CAREER_SORTS: [keyof CareerRow, string][] = [["titles", "Gelar"], ["wins", "Menang"], ["matches", "Match"], ["winRate", "Win rate"], ["gameDiff", "Selisih game"], ["leaguePoints", "Poin liga"], ["bestWinStreak", "Streak menang"]];

export function CareerTable({ comp, label, allowed, sort }: { comp: string; label: string; allowed: Set<string>; sort: keyof CareerRow }) {
  const lookup = useIdolLookup();
  const [shown, setShown] = useState(() => columnsFor(comp));
  const { data, isPending } = useQuery({ queryKey: ["career-table", comp], queryFn: () => engine().careerTable(comp), staleTime: 0 });
  if (isPending) return <p className="text-text-secondary">Menghitung statistik…</p>;
  const rows = (data ?? []).filter((r) => allowed.has(r.idolId)).sort(careerOrder(sort));
  if (!rows.length) return <p className="text-text-secondary">Belum ada match di {label} untuk idol dalam scope ini.</p>;
  const columns = CAREER_COLUMNS.filter((c) => shown.includes(c.id));
  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([careerCsv(rows, columns, lookup)], { type: "text/csv" }));
    link.download = `career-${comp.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <div className="space-y-5">
      <Podium rows={rows.slice(0, 3)} column={CAREER_COLUMNS.find((c) => c.id === (shown.includes(sort) ? sort : shown[0]))!} />
      <ColumnPicker shown={shown} onChange={setShown} />
      <div className="flex items-center gap-3">
        <p className="m-0 flex-1 text-sm text-text-secondary" aria-live="polite">{rows.length} idol</p>
        <Button onClick={download}><Download aria-hidden="true" size={16} /> Ekspor CSV</Button>
      </div>
      <VirtualTable rows={rows} rowKey={(r) => r.idolId} label={`Career Stats ${label}`}
        columns={[
          { header: "Idol", className: "sticky left-0 z-[1] bg-bg-raised whitespace-nowrap", cell: (r) => <span className="flex items-center gap-2"><IdolPhoto idolId={r.idolId} size={64} className="w-8" /><IdolLink id={r.idolId} className="font-medium" /></span> },
          ...columns.map((c) => ({ header: c.header, cell: c.value, className: "font-mono tabular-nums whitespace-nowrap" })),
        ]} />
    </div>
  );
}
