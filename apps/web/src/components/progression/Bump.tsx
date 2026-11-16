// Season Progression → a bump chart: the position after every matchday of the current top 6 of one league
// (the D1 leagues with a switcher, or The Idols alone — Update 3).
import { D1_LEAGUES } from "@sabung/shared";
import { useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { useBranding } from "../../data/branding";
import { LineRace } from "../charts/LineRace";
import { ReplayControls } from "./ReplayControls";
import { useReplay } from "./useReplay";

export function Bump({ codes = D1_LEAGUES }: { codes?: readonly string[] }) {
  const { brand } = useBranding();
  const views = useQueries({ queries: codes.map((comp) => ({ queryKey: [...SEASON_QUERY, "league", comp], queryFn: () => engine().leagueView(comp) })) });
  const [i, setI] = useState(0);
  const view = views[i]?.data;
  const top = view?.standings.slice(0, 6).map((r) => r.idolId) ?? [];
  const replay = useReplay(view ? Math.max(0, ...Object.values(view.positions).map((p) => p.length)) : 0);
  return (
    <div className="space-y-4">
      {codes.length > 1 && <div role="group" aria-label="League for the position chart" className="flex flex-wrap gap-1">
        {codes.map((c, k) => (
          <button key={c} type="button" aria-pressed={k === i} onClick={() => setI(k)}
            className={`px-2 py-1 text-xs font-bold ${k === i ? "bg-cool text-on-fill" : "bg-surface-hover/60 text-text-secondary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>{brand(c).name}</button>
        ))}
      </div>}
      <ReplayControls r={replay} label={`Positions ${brand(codes[i]!).name}`} />
      {view ? <LineRace invert label={`Positions ${brand(codes[i]!).name}`} unit="." series={top.map((id) => ({ id, values: view.positions[id] ?? [] }))} upTo={replay.day} /> : <p className="m-0 text-sm text-text-secondary">Loading…</p>}
    </div>
  );
}
