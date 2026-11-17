// One Career Stats tab (PRD §8 "spreadsheet legend"): every idol in scope for one competition key, the chosen
// columns (Update 2: chosen per format), a podium of the top three, photo + name sticky on the left, sorted, and CSV.
import { type CareerRow, careerOrder } from "@sabung/engine";
import { Button, IdolPhoto, VirtualTable, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { engine } from "../../data/engineClient";
import { CAREER_COLUMNS, columnsFor, makeAwardColumns } from "../wiki/careerColumns";
import { IdolLink } from "../wiki/IdolLink";
import { careerCsv } from "./careerCsv";
import { ColumnPicker } from "./ColumnPicker";
import { Podium } from "./Podium";

export const CAREER_SORTS: [keyof CareerRow, string][] = [["titles", "Titles"], ["wins", "Wins"], ["matches", "Match"], ["winRate", "Win rate"], ["gameDiff", "Game diff"], ["leaguePoints", "League points"], ["bestWinStreak", "Win streak"]];

export function CareerTable({ comp, label, allowed, sort }: { comp: string; label: string; allowed: Set<string>; sort: keyof CareerRow }) {
  const lookup = useIdolLookup();
  const [shown, setShown] = useState(() => columnsFor(comp));
  const { data, isPending } = useQuery({ queryKey: ["career-table", comp], queryFn: () => engine().careerTable(comp), staleTime: 0 });
  const { data: awardData } = useQuery({ queryKey: ["award-history"], queryFn: () => engine().awardHistory(), enabled: comp === "ALL", staleTime: 0 });
  const awardMap = useMemo(() => {
    if (comp !== "ALL" || !awardData) return new Map<string, Record<string, number>>();
    const m = new Map<string, Record<string, number>>();
    for (const a of awardData) {
      if (a.key === "mama") continue;
      const r = m.get(a.id) ?? {};
      r[a.key] = (r[a.key] ?? 0) + 1;
      m.set(a.id, r);
    }
    return m;
  }, [comp, awardData]);
  const awardCols = useMemo(() => comp === "ALL" ? makeAwardColumns(awardMap) : [], [comp, awardMap]);
  const allColumns = [...CAREER_COLUMNS, ...awardCols];
  if (isPending) return <p className="text-text-secondary">Crunching the numbers…</p>;
  const rows = (data ?? []).filter((r) => allowed.has(r.idolId)).sort(careerOrder(sort));
  if (!rows.length) return <p className="text-text-secondary">No matches in {label} for idols in this scope yet.</p>;
  const columns = allColumns.filter((c) => shown.includes(c.id));
  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([careerCsv(rows, columns, lookup)], { type: "text/csv" }));
    link.download = `career-${comp.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <div className="space-y-5">
      <Podium rows={rows.slice(0, 3)} column={allColumns.find((c) => c.id === (shown.includes(sort) ? sort : shown[0]))!} />
      <ColumnPicker shown={shown} onChange={setShown} columns={allColumns} />
      <div className="flex items-center gap-3">
        <p className="m-0 flex-1 text-sm text-text-secondary" aria-live="polite">{rows.length} idols</p>
        <Button onClick={download}><Download aria-hidden="true" size={16} /> Export CSV</Button>
      </div>
      <VirtualTable rows={rows} rowKey={(r) => r.idolId} label={`Career Stats ${label}`}
        columns={[
          { header: "Idol", className: "sticky left-0 z-[1] bg-bg-raised whitespace-nowrap", cell: (r) => <span className="flex items-center gap-2"><IdolPhoto idolId={r.idolId} size={64} className="w-8" /><IdolLink id={r.idolId} className="font-medium" /></span> },
          ...columns.map((c) => ({ header: c.header, cell: c.value, className: "font-mono tabular-nums whitespace-nowrap" })),
        ]} />
    </div>
  );
}
