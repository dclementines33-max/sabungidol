// The editable ratings (PRD §8 Rating Manager; rebuilt 2026-11-15 as calm rows): the tier spread, one filter row
// (search, scope, group, order), the bulk-edit bar for the selection, then one row per idol; nothing here is saved.
import type { IdolRow } from "@sabung/db";
import { Button } from "@sabung/ui";
import { useState } from "react";
import { Select } from "../idolDatabase/IdolFilters";
import { TierStrip } from "../TierStrip";
import { RatingRow } from "./RatingRow";

const input = "rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-2 py-1 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright";
const ORDERS = { rating: "Highest rating", low: "Lowest rating", name: "Name", group: "Girl group" } as const;

export function RatingList({ idols, leagueOf, draft, onChange }: {
  idols: IdolRow[];
  leagueOf: Map<string, string>;
  draft: Map<string, number>;
  onChange: (changes: Map<string, number>, label: string) => void;
}) {
  const [scope, setScope] = useState("active");
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<keyof typeof ORDERS>("rating");
  const [selected, setSelected] = useState(new Set<string>());
  const [amount, setAmount] = useState("1");
  const [limit, setLimit] = useState(40); // all 240 rows at once buried the Engine Lab
  const groups = [...new Map(idols.flatMap((i) => (i.groupId ? [[i.groupId, i.groupName!] as [string, string]] : []))).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const leagues = [...new Set(leagueOf.values())].sort();
  const value = (i: IdolRow) => draft.get(i.id) ?? i.rating;
  const sorters: Record<keyof typeof ORDERS, (a: IdolRow, b: IdolRow) => number> = {
    rating: (a, b) => b.rating - a.rating, low: (a, b) => a.rating - b.rating,
    name: (a, b) => a.name.localeCompare(b.name), group: (a, b) => (a.groupName ?? "~").localeCompare(b.groupName ?? "~") || b.rating - a.rating,
  };
  const rows = idols.filter((i) =>
    (scope === "all" || (scope === "active" ? i.active : leagueOf.get(i.id) === scope)) &&
    (group === "" || (group === "solo" ? !i.groupId : i.groupId === group)) &&
    `${i.name} ${i.groupName ?? ""}`.toLowerCase().includes(query.toLowerCase())).sort(sorters[order]);
  const bulk = (fn: (i: IdolRow) => number, label: string) =>
    onChange(new Map(rows.filter((i) => selected.has(i.id)).map((i) => [i.id, Math.max(1, Math.min(100, fn(i)))])), label);
  const n = Number(amount);

  return (
    <div className="space-y-4">
      <TierStrip ratings={rows.map(value)} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-text-secondary">Search
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Idol or girl group name" className={`${input} mt-1 block w-56`} />
        </label>
        <Select label="Scope" value={scope} onChange={setScope} options={[["active", "Active idols"], ["all", "All idols"], ...leagues.map((l): [string, string] => [l, `League ${l}`])]} />
        <Select label="Group" value={group} onChange={setGroup} options={[["", "All"], ...groups, ["solo", "Soloist"]]} />
        <Select label="Order" value={order} onChange={(v) => setOrder(v as keyof typeof ORDERS)} options={Object.entries(ORDERS)} />
      </div>
      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3" role="group" aria-label="Bulk edit">
        <p className="kicker m-0 mr-2 self-center text-text-secondary">Bulk edit · {selected.size} selected</p>
        <Button onClick={() => setSelected(new Set(rows.map((i) => i.id)))}>Select all ({rows.length})</Button>
        <Button disabled={!selected.size} onClick={() => setSelected(new Set())}>Clear selection</Button>
        <label className="text-sm text-text-secondary">Value
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${input} mt-1 block w-20 font-mono`} />
        </label>
        <Button disabled={!selected.size || !Number.isFinite(n)} onClick={() => bulk(() => n, `Set ${n}`)}>Set {selected.size} selected</Button>
        <Button disabled={!selected.size || !Number.isFinite(n)} onClick={() => bulk((i) => value(i) + n, `${n >= 0 ? "+" : ""}${n}`)}>Add to {selected.size} selected</Button>
      </div>
      <ul aria-label="Rating idol" className="m-0 list-none border-t border-border p-0">
        {rows.slice(0, limit).map((i) => (
          <RatingRow key={i.id} idol={i} league={leagueOf.get(i.id)} value={value(i)} selected={selected.has(i.id)}
            onSelect={(on) => setSelected((s) => { const next = new Set(s); if (on) next.add(i.id); else next.delete(i.id); return next; })}
            onSet={(v) => onChange(new Map([[i.id, v]]), `Edit ${i.name}`)} />
        ))}
      </ul>
      {rows.length > limit && <Button onClick={() => setLimit(limit + 40)}>Show more ({rows.length - limit} left)</Button>}
    </div>
  );
}
