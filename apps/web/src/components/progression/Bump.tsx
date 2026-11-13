// Season Progression → a bump chart: the position after every matchday of the current top 6 of one D1 league.
import { D1_LEAGUES } from "@sabung/shared";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { LineRace } from "../charts/LineRace";
import { useD1Views } from "./RaceGrid";

export function Bump() {
  const { brand } = useBranding();
  const views = useD1Views();
  const [i, setI] = useState(0);
  const view = views[i]?.data;
  const top = view?.standings.slice(0, 6).map((r) => r.idolId) ?? [];
  return (
    <div className="space-y-4">
      <div role="group" aria-label="Liga untuk grafik posisi" className="flex flex-wrap gap-1">
        {D1_LEAGUES.map((c, k) => (
          <button key={c} type="button" aria-pressed={k === i} onClick={() => setI(k)}
            className={`px-2 py-1 text-xs font-bold ${k === i ? "bg-cool text-on-fill" : "bg-surface-hover/60 text-text-secondary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>{brand(c).name}</button>
        ))}
      </div>
      {view ? <LineRace invert label={`Posisi ${brand(D1_LEAGUES[i]!).name}`} unit="." series={top.map((id) => ({ id, values: view.positions[id] ?? [] }))} /> : <p className="m-0 text-sm text-text-secondary">Membaca…</p>}
    </div>
  );
}
