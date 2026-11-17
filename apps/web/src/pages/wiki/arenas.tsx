// Arenas (2026-11-18): where Sabung Idol is fought. Every match since arenas exist is played on one, however it was
// decided. The honours and every arena's usage, then the best idols per arena; all time or one season.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { ArenaHonours } from "../../components/arenas/ArenaHonours";
import { ArenaLeaders } from "../../components/arenas/ArenaLeaders";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { engine } from "../../data/engineClient";

export const Route = createFileRoute("/wiki/arenas")({ component: Arenas });

function Arenas() {
  const { data: seasons = [] } = useQuery({ queryKey: ["season-list"], queryFn: () => engine().seasonList(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const [season, setSeason] = useState("");
  const seasonId = season || undefined;
  return (
    <div className="space-y-10">
      <PageHeader tag="Arenas" title="Where they fight" note="Every match is played on an arena: one per match, a new one every game in a grand final. Rename arenas or take them out of the draw in Studio → Marble Race." />
      <Select label="Season" value={season} onChange={setSeason} options={[["", "All time"], ...seasons.filter((s) => s.status !== "draft").map((s): [string, string] => [s.id, s.name])]} />
      <section aria-labelledby="honours" className="space-y-4">
        <h2 id="honours" className="section-title">Arena honours</h2>
        <ArenaHonours seasonId={seasonId} />
      </section>
      <section aria-labelledby="leaders" className="space-y-4">
        <h2 id="leaders" className="section-title">Best on each arena</h2>
        <ArenaLeaders key={season} seasonId={seasonId} />
      </section>
    </div>
  );
}
