// Season Progression → the six D1 title races side by side, staggered (not a grid of boxes): top 3 points per matchday.
import { D1_LEAGUES } from "@sabung/shared";
import { useQueries } from "@tanstack/react-query";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { LineRace } from "../charts/LineRace";
import { pointsByMatchday } from "../charts/titleRace";
import { ReplayControls } from "./ReplayControls";
import { useReplay } from "./useReplay";

export function useD1Views() {
  return useQueries({ queries: D1_LEAGUES.map((comp) => ({ queryKey: [...SEASON_QUERY, "league", comp], queryFn: () => engine().leagueView(comp) })) });
}

export function RaceGrid() {
  const { brand } = useBranding();
  const views = useD1Views();
  const played = (fixtures: { matches: { scoreA?: number }[] }[] = []) => fixtures.filter((f) => f.matches.some((m) => m.scoreA !== undefined)).length;
  const replay = useReplay(Math.max(0, ...views.map((v) => played(v.data?.fixtures)))); // the six races play together
  return (
    <div className="space-y-6">
    <ReplayControls r={replay} label="Title race" />
    <div className="flex flex-wrap gap-x-10 gap-y-12">
      {D1_LEAGUES.map((comp, i) => {
        const view = views[i]?.data;
        const top = view?.standings.slice(0, 3).map((r) => r.idolId) ?? [];
        const race = view ? pointsByMatchday(view.fixtures, top) : {};
        return (
          <figure key={comp} className={`m-0 w-full md:w-[calc(50%-1.25rem)] ${i % 2 ? "md:mt-12" : ""}`}>
            <figcaption className="mb-1 flex items-baseline gap-3"><span className="font-gothic text-3xl text-accent-bright">{comp.slice(2)}</span><span className="font-display text-lg">{brand(comp).name}</span></figcaption>
            {view ? <LineRace label={`Title race ${brand(comp).name}`} series={top.map((id) => ({ id, values: race[id] ?? [0] }))} upTo={replay.day + 1} /> : <p className="m-0 text-sm text-text-secondary">Loading…</p>}
          </figure>
        );
      })}
    </div>
    </div>
  );
}
