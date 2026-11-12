// Fase 2 check (not in the menu): what is in your database now — counts and the first idol cards
// with their stored photos (through the same data provider every screen will use).
import { IdolCard, StatTile } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";

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
    </div>
  );
}
