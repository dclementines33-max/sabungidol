// Settings (PRD §8). Part A (Fase 2 step 8): Season, Branding, Roster liga, Data Maker.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BrandingSettings } from "../../components/settings/BrandingSettings";
import { DataMaker } from "../../components/settings/DataMaker";
import { RosterSettings } from "../../components/settings/RosterSettings";
import { SeasonSettings } from "../../components/settings/SeasonSettings";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { useCurrentSeason, useLeagueRosters } from "../../data/seasonQuery";

export const Route = createFileRoute("/studio/settings")({ component: Settings });

function Settings() {
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const season = useCurrentSeason();
  const rosters = useLeagueRosters(season?.id) ?? {};
  if (!season) return <p className="text-text-secondary">Belum ada season.</p>;
  const draft = season.status === "draft";
  return (
    <div className="space-y-8">
      <SeasonSettings key={season.id} season={season} />
      <BrandingSettings seasonId={season.id} />
      <RosterSettings seasonId={season.id} draft={draft} rosters={rosters} activeIds={idols.filter((i) => i.active).map((i) => i.id)} />
      <DataMaker seasonId={season.id} draft={draft} idols={idols} />
    </div>
  );
}
