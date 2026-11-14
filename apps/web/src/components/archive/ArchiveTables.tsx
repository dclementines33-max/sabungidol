// Season Archive → final tables of the 13 leagues (D1A–F, D2A–F, The Idols), one shown at a time.
import type { StandingRow } from "@sabung/engine";
import { Button } from "@sabung/ui";
import { useState } from "react";
import { LeagueStandings } from "../competition/LeagueStandings";

export function ArchiveTables({ tables }: { tables: { comp: string; rows: StandingRow[] }[] }) {
  const [comp, setComp] = useState(tables[0]?.comp);
  const table = tables.find((t) => t.comp === comp);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1" role="group" aria-label="League">
        {tables.map((t) => <Button key={t.comp} aria-pressed={t.comp === comp} className={`px-3 font-mono ${t.comp === comp ? "bg-surface-hover" : ""}`} onClick={() => setComp(t.comp)}>{t.comp}</Button>)}
      </div>
      {table && <LeagueStandings zoneKey={table.comp.slice(0, 2) === "ID" ? "IDL" : table.comp.slice(0, 2)} rows={table.rows} form={{}} positions={{}} />}
    </div>
  );
}
