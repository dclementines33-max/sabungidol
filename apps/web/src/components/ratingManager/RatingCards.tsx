// The editable ratings (PRD §8 Rating Manager; Update 3: cards instead of a table): scope, search, order,
// the tier spread, selection for bulk edits, and one card per idol; nothing here is saved.
import type { IdolRow } from "@sabung/db";
import { Button } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { Select } from "../idolDatabase/IdolFilters";
import { TierStrip } from "../TierStrip";
import { RatingCard } from "./RatingCard";

const input = "rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-2 py-1 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright";
const ORDERS = { rating: "Rating tertinggi", low: "Rating terendah", name: "Nama", group: "Girl group" } as const;

export function RatingCards({ idols, leagueOf, draft, onChange }: {
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
  const [limit, setLimit] = useState(24); // 240 cards at once buried the Engine Lab
  const { data: career = [] } = useQuery({ queryKey: ["career-table", "ALL"], queryFn: () => engine().careerTable("ALL"), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const lineOf = new Map(career.map((r) => [r.idolId, r]));
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
        <label className="text-sm text-text-secondary">Cari
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nama idol atau girl group" className={`${input} mt-1 block w-56`} />
        </label>
        <Select label="Scope" value={scope} onChange={setScope} options={[["active", "Idol aktif"], ["all", "Semua idol"], ...leagues.map((l): [string, string] => [l, `Liga ${l}`])]} />
        <Select label="Group" value={group} onChange={setGroup} options={[["", "Semua"], ...groups, ["solo", "Soloist"]]} />
        <Select label="Urutan" value={order} onChange={(v) => setOrder(v as keyof typeof ORDERS)} options={Object.entries(ORDERS)} />
        <Button onClick={() => setSelected(new Set(rows.map((i) => i.id)))}>Pilih semua ({rows.length})</Button>
        <Button disabled={!selected.size} onClick={() => setSelected(new Set())}>Kosongkan pilihan</Button>
      </div>
      <div className="flex flex-wrap items-end gap-2" role="group" aria-label="Edit massal">
        <label className="text-sm text-text-secondary">Nilai
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${input} mt-1 block w-20 font-mono`} />
        </label>
        <Button disabled={!selected.size || !Number.isFinite(n)} onClick={() => bulk(() => n, `Set ${n}`)}>Set {selected.size} terpilih</Button>
        <Button disabled={!selected.size || !Number.isFinite(n)} onClick={() => bulk((i) => value(i) + n, `${n >= 0 ? "+" : ""}${n}`)}>Tambah ke {selected.size} terpilih</Button>
      </div>
      <ul aria-label="Rating idol" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3 p-0">
        {rows.slice(0, limit).map((i) => (
          <RatingCard key={i.id} idol={i} league={leagueOf.get(i.id)} value={value(i)} line={lineOf.get(i.id)} selected={selected.has(i.id)}
            onSelect={(on) => setSelected((s) => { const next = new Set(s); if (on) next.add(i.id); else next.delete(i.id); return next; })}
            onSet={(v) => onChange(new Map([[i.id, v]]), `Edit ${i.name}`)} />
        ))}
      </ul>
      {rows.length > limit && <Button onClick={() => setLimit(limit + 48)}>Tampilkan lebih ({rows.length - limit} lagi)</Button>}
    </div>
  );
}
