// The Idol Database toolbar: filters, sort and the grid/table switch (PRD §8).
import type { IdolRow } from "@sabung/db";
import { D1_LEAGUES, D2_LEAGUES, TIERS } from "@sabung/shared";
import { Button, countryName } from "@sabung/ui";
import { LayoutGrid, Table } from "lucide-react";
import type { IdolFilter } from "./filterIdols";

export type View = "grid" | "table";

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="text-sm text-text-secondary">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-2 py-1 text-text-primary">
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </label>
  );
}

export function IdolFilters({ idols, filter, onFilter, view, onView }: {
  idols: IdolRow[];
  filter: IdolFilter;
  onFilter: (f: IdolFilter) => void;
  view: View;
  onView: (v: View) => void;
}) {
  const set = (key: keyof IdolFilter) => (value: string) => onFilter({ ...filter, [key]: value });
  const groups = [...new Map(idols.flatMap((i) => (i.groupId ? [[i.groupId, i.groupName!] as [string, string]] : []))).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));
  const nationalities = [...new Set(idols.flatMap((i) => (i.nationality ? [i.nationality] : [])))].sort();
  return (
    <div role="group" aria-label="Filter idol" className="flex flex-wrap items-end gap-3">
      <Select label="Group" value={filter.group} onChange={set("group")} options={[["", "All"], ...groups, ["solo", "Soloist"]]} />
      <Select label="League" value={filter.league} onChange={set("league")} options={[["", "All"], ...[...D1_LEAGUES, ...D2_LEAGUES].map((c): [string, string] => [c, c]), ["reserve", "Reserve"]]} />
      <Select label="Tier" value={filter.tier} onChange={set("tier")} options={[["", "All"], ...TIERS.map(({ tier }): [string, string] => [tier, tier])]} />
      <Select label="Status" value={filter.status} onChange={set("status")} options={[["", "All"], ["active", "Active"], ["inactive", "Inactive"]]} />
      {nationalities.length > 0 && ( // the default data has no nationality, so the filter waits for data that does
        <Select label="Nationality" value={filter.nationality} onChange={set("nationality")} options={[["", "All"], ...nationalities.map((n): [string, string] => [n, countryName(n)])]} />
      )}
      <Select label="Sort by" value={filter.sort} onChange={set("sort")} options={[["rating", "Rating"], ["name", "Name"]]} />
      <div className="ml-auto flex gap-1" role="group" aria-label="View">
        <Button aria-pressed={view === "grid"} className={`px-2 ${view === "grid" ? "bg-surface-hover" : ""}`} onClick={() => onView("grid")}>
          <LayoutGrid aria-hidden="true" size={16} strokeWidth={1.5} /> Cards
        </Button>
        <Button aria-pressed={view === "table"} className={`px-2 ${view === "table" ? "bg-surface-hover" : ""}`} onClick={() => onView("table")}>
          <Table aria-hidden="true" size={16} strokeWidth={1.5} /> Table
        </Button>
      </div>
    </div>
  );
}
