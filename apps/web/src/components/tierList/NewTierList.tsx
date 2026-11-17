// Starting a tier list: the preset cards (each with its colour strip and rows), on their own as the empty state or inside
// the "New list" dialog with a name.
import { Button, Modal } from "@sabung/ui";
import { useState } from "react";
import { PRESETS, type PresetKey } from "./tierOps";

export function PresetCards({ onPick }: { onPick: (preset: PresetKey) => void }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
      {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
        const p = PRESETS[key];
        return (
          <li key={key}>
            <button type="button" onClick={() => onPick(key)} className="panel group flex w-full flex-col gap-3 p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent-bright">
              <span className="flex h-12 w-full gap-1">
                {p.tiers.map(([label, color]) => (
                  <span key={label} className="flex flex-1 -skew-x-12 items-end justify-center rounded-[2px] pb-1 text-[10px] font-bold text-on-fill transition-[flex] group-hover:first:flex-[1.6]" style={{ background: color }}><span className="skew-x-12 truncate px-0.5">{label}</span></span>
                ))}
              </span>
              <span className="font-display text-xl">{p.label}</span>
              <span className="text-sm text-text-secondary">{p.note}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function NewListDialog({ open, onOpenChange, suggestedName, onCreate }: {
  open: boolean; onOpenChange: (open: boolean) => void; suggestedName: string; onCreate: (name: string, preset: PresetKey) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New tier list" description="Give it a name, then pick how it starts. Every row can be renamed, recoloured, moved or deleted later." className="max-w-2xl"
      footer={<Button onClick={() => onOpenChange(false)}>Cancel</Button>}>
      <label className="mb-4 block">
        <span className="kicker block text-text-secondary">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={suggestedName} maxLength={60} className="mt-1 w-full border-b-2 border-accent-bright/60 bg-transparent py-1 font-display text-xl outline-none placeholder:text-text-secondary/60" />
      </label>
      <PresetCards onPick={(preset) => { onCreate(name.trim() || suggestedName, preset); setName(""); }} />
    </Modal>
  );
}
