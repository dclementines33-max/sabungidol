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

const VIEWS = [
  { id: "season", label: "Season & aturan", note: "Nama, kompetisi, Best of N, Engine Tuning" },
  { id: "liga", label: "Liga & roster", note: "Roster 12 liga, Data Maker" },
  { id: "branding", label: "Branding", note: "Logo dan warna kompetisi" },
  { id: "backup", label: "Backup", note: "File .sabung dan cloud" },
  { id: "data", label: "Data", note: "Penyimpanan, integritas, Rebuild Stats" },
  { id: "danger", label: "Danger Zone", note: "Reset dan hapus" },
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
  if (!season) return <p className="text-text-secondary">Belum ada season.</p>;
  const draft = season.status === "draft";
  return (
    <div className="space-y-8">
      <PageHeader tag="Settings" title="Pengaturan season dan data" note="Season, roster liga, branding, aturan, backup dan data." />
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Bagian settings" className="lg:sticky lg:top-6 lg:self-start">
          <ol className="m-0 flex list-none gap-1 overflow-x-auto p-0 pb-2 lg:flex-col lg:overflow-visible">
            {VIEWS.map((v, i) => {
              const on = v.id === view;
              return (
                <li key={v.id} className="shrink-0">
                  <Link to="/studio/settings" search={{ s: v.id }} aria-current={on ? "page" : undefined}
                    className={`flex items-baseline gap-3 border-b-2 px-3 py-2 lg:border-b-0 lg:border-l-2 lg:py-3 focus-visible:outline-2 focus-visible:outline-accent-bright ${on ? "border-accent-bright bg-surface/60 text-text-primary" : "border-transparent text-text-secondary hover:bg-surface/40 hover:text-text-primary"}`}>
                    <span aria-hidden="true" className="font-gothic text-2xl leading-none text-accent-bright">{i + 1}</span>
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
          {view === "season" && <><SeasonSettings key={season.id} season={season} /><EngineTuning key={`t-${season.id}`} season={season} /></>}
          {view === "liga" && <><RosterSettings seasonId={season.id} draft={draft} rosters={rosters} activeIds={idols.filter((i) => i.active).map((i) => i.id)} /><DataMaker seasonId={season.id} draft={draft} idols={idols} /></>}
          {view === "branding" && <BrandingSettings seasonId={season.id} />}
          {view === "backup" && <BackupSettings seasonId={season.id} />}
          {view === "data" && <DataSettings />}
          {view === "danger" && <DangerZone season={season} />}
        </div>
      </div>
    </div>
  );
}
