// Season Progression → the timing tower with its replay (2026-11-17): pick a league (the D1 leagues or The Idols), then
// play the season matchday by matchday, pause, replay or scrub. Shows the latest matchday until Play is pressed.
import { D1_LEAGUES } from "@sabung/shared";
import { useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { ReplayControls } from "./ReplayControls";
import { TimingTower, tower } from "./TimingTower";
import { useReplay } from "./useReplay";

const CODES = [...D1_LEAGUES, "IDL"];

export function TowerReplay() {
  const { brand, label } = useBranding();
  const views = useQueries({ queries: CODES.map((comp) => ({ queryKey: [...SEASON_QUERY, "league", comp], queryFn: () => engine().leagueView(comp) })) });
  const [i, setI] = useState(0);
  const view = views[i]?.data;
  const replay = useReplay(view ? Math.max(0, ...Object.values(view.positions).map((p) => p.length)) : 0);
  const name = (c: string) => (c === "IDL" ? label(c) : brand(c).name);
  return (
    <div className="space-y-4">
      <div role="group" aria-label="League for the timing tower" className="flex flex-wrap gap-1">
        {CODES.map((c, k) => (
          <button key={c} type="button" aria-pressed={k === i} onClick={() => setI(k)}
            className={`px-2 py-1 text-xs font-bold ${k === i ? "bg-cool text-on-fill" : "bg-surface-hover/60 text-text-secondary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>{name(c)}</button>
        ))}
      </div>
      <ReplayControls r={replay} label={`Standings ${name(CODES[i]!)}`} />
      {view ? (replay.total ? <TimingTower label={`Standings ${name(CODES[i]!)} after matchday ${replay.day}`} rows={tower(view, replay.day)} /> : <p className="m-0 text-sm text-text-secondary">No matchday played yet.</p>)
        : <p className="m-0 text-sm text-text-secondary">Loading…</p>}
    </div>
  );
}
