// Above the tier board: which list (when there are several), its name (edit in place), and the list actions.
import { Button, ConfirmDialog } from "@sabung/ui";
import { Plus, RotateCcw, Sparkles, Tiers, Trash } from "@sabung/ui/icons";
import { useState } from "react";
import type { TierList } from "../../data/userLists";
import { Select } from "../idolDatabase/IdolFilters";

export function TierListBar({ lists, list, placed, canFill, onPick, onRename, onNew, onAddTier, onFill, onClear, onDelete }: {
  lists: TierList[]; list: TierList; placed: number; canFill: boolean; onPick: (id: string) => void; onRename: (name: string) => void;
  onNew: () => void; onAddTier: () => void; onFill: () => void; onClear: () => void; onDelete: () => void;
}) {
  const [ask, setAsk] = useState<"clear" | "delete" | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="min-w-0 flex-1">
          <span className="kicker flex items-center gap-2 text-text-secondary"><Tiers size={14} />Tier list · {placed} placed</span>
          <input
            key={list.id} defaultValue={list.name} maxLength={60} aria-label="Tier list name"
            onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== list.name) onRename(v); else e.target.value = list.name; }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            className="mt-1 w-full border-b-2 border-transparent bg-transparent font-display text-section outline-none hover:border-border focus:border-accent-bright"
          />
        </label>
        {lists.length > 1 && <div className="w-56"><Select label="Open list" value={list.id} onChange={onPick} options={lists.map((l): [string, string] => [l.id, l.name])} /></div>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onAddTier}><Plus size={16} />Add tier</Button>
        {canFill && <Button variant="primary" onClick={onFill}><Sparkles size={16} />Fill by rating</Button>}
        <Button onClick={onNew}><Plus size={16} />New list</Button>
        {placed > 0 && <Button onClick={() => setAsk("clear")}><RotateCcw size={16} />Clear board</Button>}
        <Button variant="danger" onClick={() => setAsk("delete")}><Trash size={16} />Delete list</Button>
      </div>
      <ConfirmDialog open={ask === "clear"} onOpenChange={(o) => setAsk(o ? "clear" : null)} title="Clear the board?" message={`All ${placed} placed go back to the pool. The tiers stay.`} confirmLabel="Clear" onConfirm={() => { onClear(); setAsk(null); }} />
      <ConfirmDialog open={ask === "delete"} onOpenChange={(o) => setAsk(o ? "delete" : null)} title={`Delete "${list.name}"?`} message="The list and its tiers are removed from this browser. This cannot be undone." confirmLabel="Delete" danger onConfirm={() => { onDelete(); setAsk(null); }} />
    </div>
  );
}
