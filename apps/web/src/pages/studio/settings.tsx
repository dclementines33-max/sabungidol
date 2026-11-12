// Settings (PRD §8): Season, Branding, Roster liga, Data Maker, Engine Tuning, Data, Danger Zone.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
      <EngineTuning key={`t-${season.id}`} season={season} />
      <DataSettings />
      <BackupSettings seasonId={season.id} />
      <DangerZone season={season} />
    </div>
  );
}
