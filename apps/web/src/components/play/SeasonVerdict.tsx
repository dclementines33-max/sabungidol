// The season verdict (2026-11-15): shown when ratings are saved at season end. Risers and fallers in two columns, biggest
// change first, each with a framed photo, old → new, the delta huge and the main reasons from the expectation breakdown
// (what the idol did vs what her rating expected). Nothing is saved before "Save ratings".
import type { Part } from "@sabung/engine";
import { Button, IdolPhoto, Modal, useIdolLookup } from "@sabung/ui";
import { useBranding } from "../../data/branding";

type Row = { idolId: string; current: number; new: number; parts: Part[] };
const SHOWN = 12; // per column; the rest are summed up

function Column({ title, rows, up }: { title: string; rows: Row[]; up: boolean }) {
  const lookup = useIdolLookup();
  const { label } = useBranding();
  const what = (p: Part) => (p.key === "record" ? `Win rate ${p.stage}` : p.key === "giants" ? `Giant kills ${p.stage}` : p.key === "move" ? (p.stage === "promoted" ? "Promoted" : "Relegated") : `${label(p.key)} · ${p.stage}`);
  const tone = up ? "text-cool" : "text-accent-bright";
  return (
    <section aria-label={title} className="min-w-0">
      <p className="m-0 flex items-baseline justify-between border-b-2 pb-2" style={{ borderColor: `var(--color-${up ? "cool" : "accent-bright"})` }}>
        <span className="font-display text-2xl uppercase">{title}</span>
        <span className={`font-gothic text-3xl ${tone}`}>{rows.length}</span>
      </p>
      {rows.length === 0 ? <p className="m-0 mt-3 text-sm text-text-secondary">Nobody.</p> : (
        <ol className="m-0 list-none p-0">
          {rows.slice(0, SHOWN).map((r, i) => {
            const delta = r.new - r.current;
            return (
              <li key={r.idolId} className={`flex gap-3 border-b border-border py-3 ${i === 0 ? "py-4" : ""}`}>
                <IdolPhoto idolId={r.idolId} size={256} className={`photo-frame shrink-0 ${i === 0 ? "w-20" : "w-12"}`} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 flex items-baseline gap-2">
                    <span className={`min-w-0 flex-1 truncate font-display uppercase ${i === 0 ? "text-xl" : ""}`}>{lookup(r.idolId)?.name ?? r.idolId}</span>
                    <span className="font-mono text-xs text-text-secondary tabular-nums">{r.current} → {r.new}</span>
                    <span className={`font-display tabular-nums ${tone} ${i === 0 ? "text-3xl" : "text-xl"}`}>{delta > 0 ? "+" : "−"}{Math.abs(delta)}</span>
                  </p>
                  <ul className="m-0 mt-1 list-none space-y-0.5 p-0 text-xs text-text-secondary">
                    {r.parts.slice(0, 3).map((p) => (
                      <li key={`${p.key}-${p.stage}`} className="flex gap-2">
                        <span className="min-w-0 flex-1 truncate">{what(p)}</span>
                        <span className={`font-mono tabular-nums ${p.delta > 0 ? "text-cool" : "text-accent-bright"}`}>{p.delta > 0 ? "+" : "−"}{Math.abs(p.delta).toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {rows.length > SHOWN && <p className="m-0 mt-2 text-xs text-text-secondary">+ {rows.length - SHOWN} more</p>}
    </section>
  );
}

export function SeasonVerdict({ open, onOpenChange, rows, busy, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; rows: Row[]; busy: boolean; onSave: () => void }) {
  const delta = (r: Row) => r.new - r.current;
  const risers = rows.filter((r) => delta(r) > 0).sort((a, b) => delta(b) - delta(a));
  const fallers = rows.filter((r) => delta(r) < 0).sort((a, b) => delta(a) - delta(b));
  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-5xl" title="Season verdict"
      description="Every result measured against what each rating expected. Beat it and you climb; miss it and you fall."
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" disabled={busy} onClick={onSave}>Save ratings</Button></>}>
      <div className="grid gap-8 md:grid-cols-2">
        <Column title="Risers" rows={risers} up />
        <Column title="Fallers" rows={fallers} up={false} />
      </div>
    </Modal>
  );
}
