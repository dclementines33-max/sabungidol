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
import { engine } from "../../data/engineClient";

export const Route = createFileRoute("/wiki/champions")({ component: HallOfChampions });

const keyOf = (titleKey: string) => competitionKeyOf(titleKey.split("-")[0]!);

function HallOfChampions() {
  const { data, isPending } = useQuery({ queryKey: ["champions"], queryFn: () => engine().champions(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  if (isPending) return <p className="text-text-secondary">Membaca juara…</p>;
  if (!data?.length) return <EmptyState icon={Crown} title="Belum ada juara" description="Juara muncul di sini setelah season pertama selesai." />;
  const comps = SEASON_COMPETITIONS.filter((c) => c.key !== "SWS" && c.key !== "LCQ");
  return (
    <Tabs label="Kompetisi" tabs={comps.map((c) => {
      const titles = data.filter((t) => keyOf(t.key) === c.key);
      return {
        id: c.key, label: c.name,
        content: () => (titles.length ? (
          <div className="space-y-8">
            <WallOfFame champions={titles.map((t) => t.champion)} />
            <ChampionList titles={titles} />
          </div>
        ) : <p className="text-text-secondary">Belum ada juara {c.name}.</p>),
      };
    })} />
  );
}
