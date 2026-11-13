// Final predictions (PRD §16): every final that is ready but not played yet, with a button per idol to pick the
// winner. The pick can change until the final is played; accuracy shows on the Dashboard.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";
import type { CupCell } from "../../data/seasonRunner";

export function FinalPredictions({ cells, title }: { cells: CupCell[]; title: (c: CupCell) => string }) {
  const lookup = useIdolLookup();
  const { data, refetch } = useQuery({ queryKey: ["predictions"], queryFn: () => engine().predictions() });
  const open = cells.filter((c) => c.stage === "FN" && c.id && c.a && c.b && !c.score);
  if (open.length === 0) return null;
  const pick = async (matchId: string, idolId: string) => { await engine().predict(matchId, idolId); await refetch(); };
  return (
    <section aria-label="Tebak juara" className="space-y-3">
      <p className="kicker m-0 text-accent-bright">Tebak juara sebelum final dimainkan</p>
      {open.map((c) => (
        <div key={c.key} role="group" aria-label={`Tebakan ${title(c)}`} className="flex flex-wrap items-center gap-2">
          <span className="min-w-40 text-sm text-text-secondary">{title(c)}</span>
          {[c.a, c.b].map((id) => {
            const chosen = data?.picks[c.id] === id;
            return (
              <button key={id} type="button" aria-pressed={chosen} onClick={() => void pick(c.id, id)}
                className={`flex items-center gap-2 px-2 py-1 text-sm ${chosen ? "bg-accent text-on-accent" : "bg-surface-hover/60 hover:bg-surface-hover"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>
                <IdolPhoto idolId={id} size={64} className="h-7 w-6" />{lookup(id)?.name}
              </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}
