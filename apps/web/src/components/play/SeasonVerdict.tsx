// The season verdict (2026-11-15): shown when ratings are saved at season end. Risers and fallers in two columns, biggest
// change first, each with a framed photo, old → new, the delta huge and the main reasons from the expectation breakdown
// (what the idol did vs what her rating expected). Nothing is saved before "Save ratings".
import type { BoardTarget, Grade, Part, TargetKind } from "@sabung/engine";
import { Button, IdolPhoto, Modal, useIdolLookup } from "@sabung/ui";
import { useBranding } from "../../data/branding";

type Row = { idolId: string; current: number; new: number; parts: Part[] };
type Targets = Map<string, BoardTarget>;
export const TARGET_TEXT: Record<TargetKind, string> = { title: "Win the title", "top-4": "Top 4", promotion: "Promotion", "top-half": "Top half", survive: "Avoid relegation", "avoid-bottom": "Stay off the bottom 5" };
const GRADES: [Grade, string, string][] = [["exceeded", "Exceeded", "text-cool"], ["met", "Met", "text-text-primary"], ["missed", "Missed", "text-text-secondary"], ["failed", "Failed", "text-accent-bright"]];
const gradeOf = (g: Grade) => GRADES.find(([k]) => k === g)!;

// The board's verdict on one idol: her target, where she finished, the grade.
function TargetLine({ t }: { t: BoardTarget | undefined }) {
  if (!t?.grade) return null;
  const [, text, tone] = gradeOf(t.grade);
  return <p className="m-0 mt-1 text-xs"><span className="text-text-secondary">Board target: {TARGET_TEXT[t.kind]} · finished #{t.rank} · </span><span className={`font-bold uppercase ${tone}`}>{text}</span></p>;
}
const SHOWN = 12; // per column; the rest are summed up

function Column({ title, rows, up, targets }: { title: string; rows: Row[]; up: boolean; targets: Targets }) {
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
                  <TargetLine t={targets.get(r.idolId)} />
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

export function SeasonVerdict({ open, onOpenChange, rows, targets = [], busy, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; rows: Row[]; targets?: BoardTarget[]; busy: boolean; onSave: () => void }) {
  const byIdol: Targets = new Map(targets.map((t) => [t.idolId, t]));
  const graded = targets.filter((t) => t.grade);
  const delta = (r: Row) => r.new - r.current;
  const risers = rows.filter((r) => delta(r) > 0).sort((a, b) => delta(b) - delta(a));
  const fallers = rows.filter((r) => delta(r) < 0).sort((a, b) => delta(a) - delta(b));
  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-5xl" title="Season verdict"
      description="Every result measured against what each rating expected. Beat it and you climb; miss it and you fall."
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" disabled={busy} onClick={onSave}>Save ratings</Button></>}>
      {graded.length > 0 && (
        <section aria-label="Board targets" className="mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-border pb-3">
          <span className="kicker">Board targets</span>
          {GRADES.map(([g, text, tone]) => <span key={g}><span className={`font-display text-2xl tabular-nums ${tone}`}>{graded.filter((t) => t.grade === g).length}</span> <span className="text-sm text-text-secondary">{text}</span></span>)}
        </section>
      )}
      <div className="grid gap-8 md:grid-cols-2">
        <Column title="Risers" rows={risers} up targets={byIdol} />
        <Column title="Fallers" rows={fallers} up={false} targets={byIdol} />
      </div>
    </Modal>
  );
}
