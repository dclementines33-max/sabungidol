// Fase 2 check (not in the menu): what is in your database now — counts and the first idol cards
// with their stored photos (through the same data provider every screen will use).
import { IdolCard, StatTile } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";

export const Route = createFileRoute("/dev/data")({ component: DataCheck });

function DataCheck() {
  const { data: idols = [], isPending } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  if (isPending) return <p className="text-text-secondary">Membaca database…</p>;
  const groups = new Set(idols.flatMap((i) => (i.groupName ? [i.groupName] : [])));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="data-counts">
        <StatTile label="Idol" value={idols.length} />
        <StatTile label="Girl group" value={groups.size} />
        <StatTile label="Soloist" value={idols.filter((i) => !i.groupName).length} />
        <StatTile label="Dengan foto" value={idols.filter((i) => i.photoId).length} />
      </div>
      <div className="flex flex-wrap gap-4">
        {idols.slice(0, 12).map((i) => <IdolCard key={i.id} idolId={i.id} />)}
      </div>
      <Rosters names={new Map(idols.map((i) => [i.id, i.name]))} />
    </div>
  );
}

// Season 1's league rosters and the idols left out of them (reserves).
function Rosters({ names }: { names: Map<string, string> }) {
  const season = useCurrentSeason();
  const { data: rosters } = useQuery({ queryKey: [...SEASON_QUERY, "rosters", season?.id], queryFn: () => engine().leagueRosters(season!.id), enabled: !!season });
  if (!season || !rosters) return <p className="text-text-secondary">Belum ada season.</p>;
  const placed = new Set(Object.values(rosters).flat());
  const reserves = [...names.keys()].filter((id) => !placed.has(id));
  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg">{season.name} · {season.status}</h2>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Object.entries(rosters).map(([comp, ids]) => (
          <div key={comp} data-testid={`roster-${comp}`}>
            <h3 className="font-mono text-sm text-text-secondary">{comp} ({ids.length})</h3>
            <ol className="text-sm">{ids.map((id) => <li key={id}>{names.get(id)}</li>)}</ol>
          </div>
        ))}
      </div>
      <p data-testid="reserves">Cadangan ({reserves.length}): {reserves.map((id) => names.get(id)).join(", ")}</p>
    </section>
  );
}
