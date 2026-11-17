// Settings (PRD §8; split 2026-11-15): a side nav (a scrolling strip on phones) and one view at a time, picked by ?s= so
// other screens can link straight to a view (Home → Backup). Season + Engine Tuning, league rosters + Data Maker,
// branding, backup, data, Danger Zone.
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BackupSettings } from "../../components/settings/BackupSettings";
import { BrandingSettings } from "../../components/settings/BrandingSettings";
import { DangerZone } from "../../components/settings/DangerZone";
import { DataMaker } from "../../components/settings/DataMaker";
import { DataSettings } from "../../components/settings/DataSettings";
import { EngineTuning } from "../../components/settings/EngineTuning";
import { RosterSettings } from "../../components/settings/RosterSettings";
import { SeasonSettings } from "../../components/settings/SeasonSettings";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { useCurrentSeason, useLeagueRosters } from "../../data/seasonQuery";
import { PageHeader } from "../../components/PageHeader";
import { SectionBoundary } from "../../components/SectionBoundary";

const VIEWS = [
  { id: "season", label: "Season & rules", note: "Name, competitions, Best of N, Engine Tuning" },
  { id: "leagues", label: "Leagues & rosters", note: "12 league rosters, Data Maker" },
  { id: "branding", label: "Branding", note: "Competition logos and colours" },
  { id: "backup", label: "Backup", note: ".sabung files and cloud" },
  { id: "data", label: "Data", note: "Storage, integrity, Rebuild Stats" },
  { id: "danger", label: "Danger Zone", note: "Reset and delete" },
] as const;
type View = (typeof VIEWS)[number]["id"];

export const Route = createFileRoute("/studio/settings")({
  validateSearch: (s): { s?: View } => ({ s: VIEWS.some((v) => v.id === s.s) ? (s.s as View) : undefined }),
  component: Settings,
});

function Settings() {
  const view = Route.useSearch().s ?? "season";
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const season = useCurrentSeason();
  const rosters = useLeagueRosters(season?.id) ?? {};
  if (!season) return <p className="text-text-secondary">No season yet.</p>;
  const draft = season.status === "draft";
  return (
    <div className="space-y-8">
      <PageHeader tag="Settings" title="Season and data settings" note="Season, league rosters, branding, rules, backup and data." />
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <ol className="m-0 flex list-none gap-1 overflow-x-auto p-0 pb-2 lg:flex-col lg:overflow-visible">
            {VIEWS.map((v) => {
              const on = v.id === view;
              return (
                <li key={v.id} className="shrink-0">
                  <Link to="/studio/settings" search={{ s: v.id }} aria-current={on ? "page" : undefined}
                    className={`flex items-baseline gap-3 border-b-2 px-3 py-2 lg:border-b-0 lg:border-l-2 lg:py-3 focus-visible:outline-2 focus-visible:outline-accent-bright ${on ? "border-accent-bright bg-surface/60 text-text-primary" : "border-transparent text-text-secondary hover:bg-surface/40 hover:text-text-primary"}`}>
                    <span>
                      <span className={`block font-display whitespace-nowrap ${v.id === "danger" ? "text-danger" : ""}`}>{v.label}</span>
                      <span className="hidden text-xs text-text-secondary lg:block">{v.note}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="studio-flow min-w-0 space-y-8">
          {view === "season" && <><SectionBoundary name="Season"><SeasonSettings key={season.id} season={season} /></SectionBoundary><SectionBoundary name="Engine Tuning"><EngineTuning key={`t-${season.id}`} season={season} /></SectionBoundary></>}
          {view === "leagues" && <><SectionBoundary name="League rosters"><RosterSettings seasonId={season.id} draft={draft} rosters={rosters} activeIds={idols.filter((i) => i.active).map((i) => i.id)} /></SectionBoundary><SectionBoundary name="Data Maker"><DataMaker seasonId={season.id} draft={draft} idols={idols} /></SectionBoundary></>}
          {view === "branding" && <SectionBoundary name="Branding"><BrandingSettings seasonId={season.id} /></SectionBoundary>}
          {view === "backup" && <SectionBoundary name="Backup"><BackupSettings seasonId={season.id} /></SectionBoundary>}
          {view === "data" && <SectionBoundary name="Data"><DataSettings /></SectionBoundary>}
          {view === "danger" && <SectionBoundary name="Danger Zone"><DangerZone season={season} /></SectionBoundary>}
        </div>
      </div>
    </div>
  );
}
