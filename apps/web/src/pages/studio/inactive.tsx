// Inactive Manager (PRD §8): Active / Inactive columns, bulk and drag & drop. Deactivating an idol
// with a league place asks for a replacement from the reserves (automatic suggestion, changeable).
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { IdolColumn } from "../../components/inactiveManager/IdolColumn";
import { type Replacement, ReplacementDialog } from "../../components/inactiveManager/ReplacementDialog";
import { suggestReplacements } from "../../components/inactiveManager/suggestReplacements";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY, useCurrentSeason, useLeagueRosters } from "../../data/seasonQuery";

export const Route = createFileRoute("/studio/inactive")({ component: InactiveManager });

function InactiveManager() {
  const { data: idols = [], isPending } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const rosters = useLeagueRosters(useCurrentSeason()?.id) ?? {};
  const [selected, setSelected] = useState(new Set<string>());
  const [pending, setPending] = useState<{ ids: string[]; rows: Replacement[] } | null>(null);
  if (isPending) return <p className="text-text-secondary">Membaca database…</p>;

  const toggle = (ids: string[], on: boolean) => setSelected((s) => { const next = new Set(s); ids.forEach((id) => (on ? next.add(id) : next.delete(id))); return next; });
  const done = async (message: string) => {
    setSelected(new Set());
    setPending(null);
    notify({ level: "success", message });
    await Promise.all([queryClient.invalidateQueries({ queryKey: IDOLS_QUERY }), queryClient.invalidateQueries({ queryKey: SEASON_QUERY })]);
  };
  const activate = async (ids: string[]) => {
    await engine().setActive(ids, true);
    await done(`${ids.length} idol diaktifkan`);
  };
  const deactivate = async (ids: string[], rows: Replacement[]) => {
    await engine().deactivate(ids, Object.fromEntries(rows.flatMap((r) => (r.suggestion ? [[r.id, r.suggestion]] : []))));
    await done(`${ids.length} idol dinonaktifkan${rows.length ? `, ${rows.filter((r) => r.suggestion).length} tempat liga diganti` : ""}`);
  };
  const askDeactivate = (ids: string[]) => {
    const rows = suggestReplacements(ids, rosters, idols);
    if (rows.length) setPending({ ids, rows });
    else deactivate(ids, []);
  };
  const placed = new Set(Object.values(rosters).flat());
  const reserves = idols.filter((i) => i.active && !placed.has(i.id) && !pending?.ids.includes(i.id)).sort((a, b) => b.rating - a.rating).map((i) => i.id);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <IdolColumn title="Aktif" idols={idols.filter((i) => i.active)} selected={selected} onToggle={toggle} actionLabel="Nonaktifkan"
        onMove={(ids) => (idols.find((i) => i.id === ids[0])?.active ? askDeactivate(ids) : activate(ids))} />
      <IdolColumn title="Nonaktif" idols={idols.filter((i) => !i.active)} selected={selected} onToggle={toggle} actionLabel="Aktifkan"
        onMove={(ids) => (idols.find((i) => i.id === ids[0])?.active ? askDeactivate(ids) : activate(ids))} />
      {pending && (
        <ReplacementDialog rows={pending.rows} reserves={reserves}
          onChange={(id, replacement) => setPending({ ...pending, rows: pending.rows.map((r) => (r.id === id ? { ...r, suggestion: replacement } : r)) })}
          onCancel={() => setPending(null)} onConfirm={() => deactivate(pending.ids, pending.rows)} />
      )}
    </div>
  );
}
