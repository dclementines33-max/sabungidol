// Tier List (2026-11-17): the user builds tier lists of idols or girl groups — any rows, names and colours — and fills them
// by dragging (hold on a phone) or tapping an item then a tier. Several lists per kind, saved in this browser.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KindSwitch } from "../../components/KindSwitch";
import { PageHeader } from "../../components/PageHeader";
import { usePointerDrag } from "../../components/dnd/usePointerDrag";
import { EntryFace } from "../../components/ranking/EntryFace";
import { useEntries } from "../../components/ranking/useEntries";
import { NewListDialog, PresetCards } from "../../components/tierList/NewTierList";
import { TierChip } from "../../components/tierList/TierChip";
import { TierListBar } from "../../components/tierList/TierListBar";
import { TierPool } from "../../components/tierList/TierPool";
import { TierRowView } from "../../components/tierList/TierRowView";
import { POOL, type PresetKey, addTier, clearAll, fillByRating, moveTier, newList, place, removeTier, updateTier } from "../../components/tierList/tierOps";
import { type Kind, type TierList, useListsReady, useUserLists } from "../../data/userLists";

export const Route = createFileRoute("/wiki/tiers")({ component: TierListPage });

function TierListPage() {
  const [kind, setKind] = useState<Kind>("idol");
  const ready = useListsReady();
  const entries = useEntries(kind);
  const lists = useUserLists((s) => s.lists).filter((l) => l.kind === kind);
  const save = useUserLists((s) => s.saveList);
  const removeList = useUserLists((s) => s.removeList);
  const [active, setActive] = useState<Record<Kind, string | null>>({ idol: null, group: null });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const list = lists.find((l) => l.id === active[kind]) ?? lists[0];
  const change = (fn: (l: TierList) => TierList) => { if (list) save(fn(list)); };
  const put = (id: string, tier: string, index: number | null) => { change((l) => place(l, id, tier, index)); setSelected(null); };
  const { drag, bind } = usePointerDrag(put);

  useEffect(() => { setSelected(null); }, [kind, list?.id]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  if (!ready || !entries) return <p className="text-text-secondary">Setting up the board…</p>;
  const noun = kind === "idol" ? "idol" : "girl group";
  const create = (name: string, preset: PresetKey) => {
    const made = newList(kind, preset, name);
    save(made);
    setActive({ ...active, [kind]: made.id });
    setCreating(false);
  };
  const suggestedName = `My ${noun} tier list${lists.length ? ` ${lists.length + 1}` : ""}`;
  const header = <PageHeader tag="Tier List" title="Rank them your way" note={`Build your own ${noun} tiers: any rows, any names, any colours. Drag (hold on a phone) or tap ${kind === "idol" ? "an idol" : "a girl group"} then a tier.`} />;
  const dialog = <NewListDialog open={creating} onOpenChange={setCreating} suggestedName={suggestedName} onCreate={create} />;

  if (!list) return (
    <div className="space-y-8">
      {header}
      <KindSwitch value={kind} onChange={setKind} />
      <section aria-labelledby="start" className="space-y-4">
        <h3 id="start" className="section-title m-0">Start your first {noun} tier list</h3>
        <PresetCards onPick={(preset) => create(suggestedName, preset)} />
      </section>
    </div>
  );

  const known = (id: string) => entries.byId.has(id);
  const placed = new Set(list.tiers.flatMap((t) => (list.placed[t.id] ?? []).filter(known)));
  const pool = entries.list.filter((e) => !placed.has(e.id));
  const canFill = pool.length > 0 && list.tiers.some((t) => ["S+", "S", "A", "B", "C", "D", "F"].includes(t.label.trim().toUpperCase()));
  const chip = (id: string, index: number) => (
    <TierChip key={id} entry={entries.byId.get(id)!} index={index} selected={selected === id} faded={drag?.id === id} drag={bind(id)} onSelect={() => setSelected(selected === id ? null : id)} />
  );
  const ghost = drag && entries.byId.get(drag.id);
  const groupOptions = kind === "idol"
    ? [...new Map(entries.list.filter((e) => e.groupId).map((e) => [e.groupId!, e.sub])).entries()].sort((a, b) => a[1].localeCompare(b[1]))
    : null;

  return (
    <div className="space-y-6">
      {header}
      <KindSwitch value={kind} onChange={setKind} />
      <TierListBar
        lists={lists} list={list} placed={placed.size} canFill={canFill}
        onPick={(id) => setActive({ ...active, [kind]: id })} onRename={(name) => change((l) => ({ ...l, name }))}
        onNew={() => setCreating(true)} onAddTier={() => change(addTier)} onFill={() => change((l) => fillByRating(l, pool))}
        onClear={() => change(clearAll)} onDelete={() => { removeList(list.id); setActive({ ...active, [kind]: null }); }}
      />
      <p aria-live="polite" className="m-0 min-h-6 text-sm text-accent-bright">
        {selected && entries.byId.get(selected) ? `Picked up ${entries.byId.get(selected)!.name}: tap a tier to place, or press Esc.` : ""}
      </p>
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_19rem] md:items-start md:gap-4">
      <ol aria-label="Tiers" className="m-0 list-none space-y-1.5 p-0">
        {list.tiers.map((t, i) => {
          const ids = (list.placed[t.id] ?? []).filter(known);
          return (
            <TierRowView
              key={t.id} tier={t} count={ids.length} over={drag?.over === t.id} armed={!!selected && !drag} first={i === 0} last={i === list.tiers.length - 1}
              onPlace={() => selected && put(selected, t.id, null)} onRename={(label) => change((l) => updateTier(l, t.id, { label }))}
              onColor={(color) => change((l) => updateTier(l, t.id, { color }))} onMove={(step) => change((l) => moveTier(l, t.id, step))} onRemove={() => change((l) => removeTier(l, t.id))}
            >
              {ids.map(chip)}
            </TierRowView>
          );
        })}
      </ol>
      <TierPool
        items={pool} total={entries.list.length} over={drag?.over === POOL} armed={!!selected && placed.has(selected) && !drag}
        onPlace={() => selected && put(selected, POOL, null)} groupOptions={groupOptions} render={(shown) => shown.map((e, i) => chip(e.id, i))}
      />
      </div>
      {ghost && drag && (
        <div aria-hidden="true" className="pointer-events-none fixed z-50 w-16 -translate-x-1/2 -translate-y-1/2 -rotate-6 drop-shadow-[0_18px_30px_rgb(255_77_99/0.55)] sm:w-20" style={{ left: drag.x, top: drag.y }}>
          <EntryFace entry={ghost} logo="size-4" className="w-full" />
        </div>
      )}
      {dialog}
    </div>
  );
}
