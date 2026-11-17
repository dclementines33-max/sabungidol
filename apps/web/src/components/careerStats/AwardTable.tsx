// Awards tab in Career Stats: one row per idol, total awards + per-type columns, sortable.
import { Button, IdolPhoto, VirtualTable, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { engine } from "../../data/engineClient";
import { AWARD_TEXT } from "../play/awardText";
import { IdolLink } from "../wiki/IdolLink";
import { AWARD_IDOL_KEYS } from "../wiki/careerColumns";

type AwardRow = { idolId: string; total: number } & Record<string, number>;

const HEADERS: Record<string, string> = { total: "Total", mvi: "MVI", iots: "IOTS", "golden-disk": "G.Disk", "chart-topper": "ChTop", encore: "Encore", daebak: "Daebak", unbreakable: "Unbk.", "trend-setter": "Trend", "glow-up": "Glow", "hallyu-wave": "Hallyu" };
type SortKey = "total" | typeof AWARD_IDOL_KEYS[number];
const AWARD_SORTS: [SortKey, string][] = [["total", "Total awards"], ...AWARD_IDOL_KEYS.map((k): [SortKey, string] => [k, AWARD_TEXT[k].name])];

export function AwardTable({ allowed }: { allowed: Set<string> }) {
  const lookup = useIdolLookup();
  const [sort, setSort] = useState<SortKey>("total");
  const { data, isPending } = useQuery({ queryKey: ["award-history"], queryFn: () => engine().awardHistory(), staleTime: 0 });
  const rows = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const a of data ?? []) {
      if (a.key === "mama") continue;
      const r = m.get(a.id) ?? {};
      r[a.key] = (r[a.key] ?? 0) + 1;
      m.set(a.id, r);
    }
    return [...m.entries()]
      .filter(([id]) => allowed.has(id))
      .map(([id, awards]) => ({ idolId: id, total: Object.values(awards).reduce((s, v) => s + v, 0), ...awards } as AwardRow))
      .sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));
  }, [data, allowed, sort]);
  if (isPending) return <p className="text-text-secondary">Crunching the numbers…</p>;
  if (!rows.length) return <p className="text-text-secondary">No awards for idols in this scope yet.</p>;
  const download = () => {
    const header = ["Idol", "Total", ...AWARD_IDOL_KEYS.map((k) => HEADERS[k]!)].join(",");
    const csv = [header, ...rows.map((r) => [lookup(r.idolId)?.name ?? r.idolId, r.total, ...AWARD_IDOL_KEYS.map((k) => r[k] ?? 0)].join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "career-awards.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Sort awards" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="select">
            {AWARD_SORTS.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <p className="m-0 flex-1 text-sm text-text-secondary" aria-live="polite">{rows.length} idols</p>
        <Button onClick={download}><Download aria-hidden="true" size={16} /> Export CSV</Button>
      </div>
      <VirtualTable rows={rows} rowKey={(r) => r.idolId} label="Award Stats"
        columns={[
          { header: "Idol", className: "sticky left-0 z-[1] bg-bg-raised whitespace-nowrap", cell: (r) => <span className="flex items-center gap-2"><IdolPhoto idolId={r.idolId} size={64} className="w-8" /><IdolLink id={r.idolId} className="font-medium" /></span> },
          { header: "Total", cell: (r) => r.total, className: "font-mono tabular-nums whitespace-nowrap font-bold" },
          ...AWARD_IDOL_KEYS.map((k) => ({ header: HEADERS[k]!, cell: (r: AwardRow) => r[k] ?? 0, className: "font-mono tabular-nums whitespace-nowrap" })),
        ]} />
    </div>
  );
}
