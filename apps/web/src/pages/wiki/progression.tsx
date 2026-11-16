// Season Progression (Update 2): what happened in this season as charts — the six D1 title races, one league's
// positions over time, The Idols' positions (Update 3, instead of how far every competition is), which girl groups took this season's titles,
// and the telemetry: who is beating her rating and who isn't (2026-11-17).
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bump } from "../../components/progression/Bump";
import { RaceGrid } from "../../components/progression/RaceGrid";
import { Telemetry } from "../../components/progression/Telemetry";
import { TitleShare } from "../../components/progression/TitleShare";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";

export const Route = createFileRoute("/wiki/progression")({ component: Progression });


function Chapter({ n, title, note, children }: { n: string; title: string; note: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`ch-${n}`} className="relative isolate space-y-5">
      <span aria-hidden="true" className="absolute -top-8 -left-2 -z-10 font-gothic text-[6rem] leading-none text-accent/25">{n}</span>
      <h2 id={`ch-${n}`} className="m-0 text-[clamp(1.75rem,4vw,3rem)]">{title}</h2>
      <p className="m-0 max-w-prose text-text-secondary">{note}</p>
      {children}
    </section>
  );
}

function Progression() {
  const season = useCurrentSeason();
  const live = season?.status === "live";
  const { data: o } = useQuery({ queryKey: [...SEASON_QUERY, "overview", season?.id, season?.status], queryFn: () => engine().seasonOverview(), enabled: live });
  const { data: telemetry } = useQuery({ queryKey: [...SEASON_QUERY, "telemetry", season?.id], queryFn: () => engine().seasonTelemetry(), enabled: live });
  if (!season) return <p className="text-text-secondary">Loading season…</p>;
  if (!live) return <p className="text-text-secondary">Season Progression shows while a season is live.</p>;
  return (
    <div className="space-y-20">
      <header>
        <p className="m-0 flex items-center gap-3"><span className="tag">Season Progression</span><span className="kicker">{season.name}</span></p>
        <h2 className="m-0 mt-3 text-[clamp(2.5rem,7vw,5.5rem)]">The season's storyline</h2>
      </header>
      <Chapter n="01" title="Division 1 title race" note="The top three's points in each league after every matchday.">
        <RaceGrid />
      </Chapter>
      <Chapter n="02" title="Standings movement" note="Where the current top six stood, matchday by matchday. Top line = 1st place.">
        <Bump />
      </Chapter>
      <div className="flex flex-col gap-16 lg:flex-row">
        <div className="flex-1">
          <Chapter n="03" title="The Idols movement" note="Where The Idols' top six stood, matchday by matchday. Top line = 1st place.">
            <Bump codes={["IDL"]} />
          </Chapter>
        </div>
        <div className="flex-1 lg:mt-24">
          <Chapter n="04" title="Titles by girl group" note="This season's champions in every competition, grouped by girl group.">
            {o && <TitleShare titles={o.titles as Record<string, { champion: string } | undefined>} />}
          </Chapter>
        </div>
      </div>
      <Chapter n="05" title="Telemetry" note="Every idol's share of games won against what her rating expected. Above the line she is beating her rating; below it, falling short.">
        {telemetry && <Telemetry rows={telemetry} />}
      </Chapter>
    </div>
  );
}
