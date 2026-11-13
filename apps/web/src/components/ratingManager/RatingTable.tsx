// The editable rating table (PRD §8 Rating Manager): scope filter, selection for bulk edits, and a
// draft column; nothing here is saved.
import type { IdolRow } from "@sabung/db";
import { Button, RatingBadge, VirtualTable } from "@sabung/ui";
import { useState } from "react";

const input = "w-20 rounded-control border border-border-strong bg-surface px-2 py-1 font-mono tabular-nums text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright";

export function RatingTable({ idols, leagueOf, draft, onChange }: {
  idols: IdolRow[];
  leagueOf: Map<string, string>;
  draft: Map<string, number>;
  onChange: (changes: Map<string, number>, label: string) => void;
}) {
  const [scope, setScope] = useState("active");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set<string>());
  const [amount, setAmount] = useState("1");
  const leagues = [...new Set(leagueOf.values())].sort();
  const rows = idols.filter((i) =>
    (scope === "all" || (scope === "active" ? i.active : leagueOf.get(i.id) === scope)) &&
    `${i.name} ${i.groupName ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const value = (i: IdolRow) => draft.get(i.id) ?? i.rating;
  const bulk = (fn: (i: IdolRow) => number, label: string) =>
    onChange(new Map(rows.filter((i) => selected.has(i.id)).map((i) => [i.id, Math.max(1, Math.min(100, fn(i)))])), label);
  const n = Number(amount);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-text-secondary">Scope
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={`${input} mt-1 block w-40 font-sans`}>
            <option value="active">Idol aktif</option><option value="all">Semua idol</option>
            {leagues.map((l) => <option key={l} value={l}>Liga {l}</option>)}
          </select>
        </label>
        <label className="text-sm text-text-secondary">Cari
          <input value={query} onChange={(e) => setQuery(e.target.value)} className={`${input} mt-1 block w-48 font-sans`} />
        </label>
        <Button onClick={() => setSelected(new Set(rows.map((i) => i.id)))}>Pilih semua ({rows.length})</Button>
        <Button disabled={!selected.size} onClick={() => setSelected(new Set())}>Kosongkan pilihan</Button>
      </div>
      <div className="flex flex-wrap items-end gap-2" role="group" aria-label="Edit massal">
        <label className="text-sm text-text-secondary">Nilai
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${input} mt-1 block`} />
        </label>
        <Button disabled={!selected.size || !Number.isFinite(n)} onClick={() => bulk(() => n, `Set ${n}`)}>Set {selected.size} terpilih</Button>
        <Button disabled={!selected.size || !Number.isFinite(n)} onClick={() => bulk((i) => value(i) + n, `${n >= 0 ? "+" : ""}${n}`)}>Tambah ke {selected.size} terpilih</Button>
      </div>
      <VirtualTable rows={rows} rowKey={(i) => i.id} label="Rating idol" height="60vh" columns={[
        { header: "Pilih", cell: (i) => (
          <input type="checkbox" aria-label={`Pilih ${i.name}`} checked={selected.has(i.id)}
            onChange={(e) => setSelected((s) => { const next = new Set(s); if (e.target.checked) next.add(i.id); else next.delete(i.id); return next; })} />
        ) },
        { header: "Idol", cell: (i) => <span>{i.name} <span className="text-text-secondary">· {i.groupName ?? "Soloist"}</span></span> },
        { header: "Liga", cell: (i) => <span className="font-mono">{leagueOf.get(i.id) ?? "–"}</span> },
        { header: "Rating", cell: (i) => <RatingBadge rating={i.rating} /> },
        { header: "Baru", cell: (i) => (
          <input type="number" min={1} max={100} aria-label={`Rating baru ${i.name}`} value={value(i)}
            className={`${input} ${draft.has(i.id) ? "border-accent-bright" : ""}`}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 1 && v <= 100) onChange(new Map([[i.id, v]]), `Edit ${i.name}`); }} />
        ) },
      ]} />
    </div>
  );
}
