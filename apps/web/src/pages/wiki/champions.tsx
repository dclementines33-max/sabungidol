// Hall of Champions (PRD §8): one tab per competition with titles (Swiss and LCQ have none): the wall of
// fame (most titles) and the champions per season with runner-up and final score.
import { SEASON_COMPETITIONS, competitionKeyOf } from "@sabung/shared";
import { EmptyState } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { ChampionList } from "../../components/champions/ChampionList";
import { WallOfFame } from "../../components/champions/WallOfFame";
import { Tabs } from "../../components/competition/Tabs";
import { PageHeader } from "../../components/PageHeader";
import { engine } from "../../data/engineClient";

export const Route = createFileRoute("/wiki/champions")({ component: HallOfChampions });

const keyOf = (titleKey: string) => competitionKeyOf(titleKey.split("-")[0]!);

function HallOfChampions() {
  const { data, isPending } = useQuery({ queryKey: ["champions"], queryFn: () => engine().champions(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  if (isPending) return <p className="text-text-secondary">Loading champions…</p>;
  if (!data?.length) return <EmptyState icon={Crown} title="No champions yet" description="Champions show up here once the first season is done." />;
  const comps = SEASON_COMPETITIONS.filter((c) => c.key !== "SWS" && c.key !== "LCQ");
  return (
    <div className="space-y-8">
    <PageHeader tag="Hall of Champions" title="Every title, every season" note="Pick a competition: most titles first, then every final." />
    <Tabs label="Competition" tabs={comps.map((c) => {
      const titles = data.filter((t) => keyOf(t.key) === c.key);
      return {
        id: c.key, label: c.name,
        content: () => (titles.length ? (
          <div className="space-y-8">
            <WallOfFame champions={titles.map((t) => t.champion)} />
            <ChampionList titles={titles} />
          </div>
        ) : <p className="text-text-secondary">No {c.name} champion yet.</p>),
      };
    })} />
    </div>
  );
}
