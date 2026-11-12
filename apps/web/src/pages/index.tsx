// Home (PRD §8). While the season is still a draft: the first-run welcome. The cinematic Home with
// the last champion comes with Play (Fase 3).
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Welcome } from "../components/home/Welcome";
import { PanelPlaceholder } from "../components/PanelPlaceholder";
import { engine } from "../data/engineClient";
import { IDOLS_QUERY } from "../data/IdolDataProvider";
import { useCurrentSeason, useLeagueRosters } from "../data/seasonQuery";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const season = useCurrentSeason();
  const rosters = useLeagueRosters(season?.id) ?? {};
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  if (season?.status !== "draft") return <PanelPlaceholder />;
  const placed = new Set(Object.values(rosters).flat());
  return <Welcome seasonName={season.name} idols={idols.length} leagues={Object.keys(rosters).length} reserves={idols.filter((i) => i.active && !placed.has(i.id)).length} />;
}
