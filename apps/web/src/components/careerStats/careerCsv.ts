// Career Stats as CSV (PRD §8 "ekspor CSV"): name, group, then the chosen columns, in the shown order.
import type { CareerRow } from "@sabung/engine";
import type { CareerColumn } from "../wiki/careerColumns";

const cell = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v));

export function careerCsv(rows: CareerRow[], columns: CareerColumn[], idol: (id: string) => { name: string; groupName: string | null } | undefined): string {
  const lines = [["Nama", "Group", ...columns.map((c) => c.header)]];
  for (const r of rows) lines.push([idol(r.idolId)?.name ?? r.idolId, idol(r.idolId)?.groupName ?? "Soloist", ...columns.map((c) => String(c.value(r)))]);
  return lines.map((l) => l.map(cell).join(",")).join("\n");
}
