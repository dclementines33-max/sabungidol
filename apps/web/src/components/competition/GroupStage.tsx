// LCQ and Unzure groups (Update 2 ref "2 group stage"): one group at a time picked from a row of letters, its
// table beside its full schedule (played scores and open matches to click).
import { useState } from "react";
import type { CupCell } from "../../data/seasonRunner";
import { GroupTable, type GroupRow } from "./GroupTable";
import { MatchList } from "./MatchList";

const LETTERS = "ABCDEFGHIJKLMNOP";

export function GroupStage({ tables, cells, stage, through, busy, onOpen }: {
  tables: GroupRow[][];
  cells: CupCell[];
  stage: string;
  through: number;
  busy: boolean;
  onOpen: (matchId: string) => void;
}) {
  const [g, setG] = useState(0);
  if (tables.length === 0) return <p className="m-0 text-sm text-text-secondary">Grup terisi setelah fase sebelumnya selesai.</p>;
  const letter = LETTERS[g]!;
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Pilih grup" className="flex flex-wrap gap-1">
        {tables.map((_, i) => (
          <button key={i} type="button" aria-pressed={i === g} onClick={() => setG(i)}
            className={`size-9 font-display text-sm ${i === g ? "bg-accent text-on-accent shadow-lg shadow-accent/30" : "bg-surface-hover/60 text-text-secondary hover:text-text-primary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>
            {LETTERS[i]}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p aria-hidden="true" className="m-0 -mb-6 font-gothic text-[5rem] leading-none text-accent/40">{letter}</p>
          <GroupTable name={`Grup ${letter}`} rows={tables[g]!} through={through} />
          <p className="kicker m-0 mt-2 text-text-secondary">{through} teratas lolos · Menang 3 · Seri 1</p>
        </div>
        <div>
          <h3 className="kicker m-0 mb-2">Jadwal grup {letter}</h3>
          <MatchList cells={cells.filter((c) => c.stage === stage && c.round.startsWith(`${letter}-`))} busy={busy} onOpen={onOpen} roundLabel={(r) => r.split("-").slice(1).join(" ")} />
        </div>
      </div>
    </div>
  );
}
