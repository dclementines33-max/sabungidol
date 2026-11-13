// Idol Database (PRD §8): every idol as photo cards or a virtual table, with filters and sort.
// Inactive idols stay here with a badge.
import { Button, EmptyState } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SearchX, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { IdolDatabaseGrid } from "../../../components/idolDatabase/IdolDatabaseGrid";
import { IdolDatabaseTable } from "../../../components/idolDatabase/IdolDatabaseTable";
import { IdolFilters, type View } from "../../../components/idolDatabase/IdolFilters";
import { NO_FILTER, filterIdols } from "../../../components/idolDatabase/filterIdols";
import { engine } from "../../../data/engineClient";
import { IDOLS_QUERY } from "../../../data/IdolDataProvider";
import { useCurrentSeason, useLeagueRosters } from "../../../data/seasonQuery";
import { PageHeader } from "../../../components/PageHeader";

export const Route = createFileRoute("/wiki/idols/")({ component: IdolDatabase });

function IdolDatabase() {
  const { data: idols = [], isPending } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const rosters = useLeagueRosters(useCurrentSeason()?.id);
  const [filter, setFilter] = useState(NO_FILTER);
  const [view, setView] = useState<View>("grid");
  const leagueOf = useMemo(() => new Map(Object.entries(rosters ?? {}).flatMap(([comp, ids]) => ids.map((id) => [id, comp] as const))), [rosters]);
  const shown = useMemo(() => filterIdols(idols, leagueOf, filter), [idols, leagueOf, filter]);

  if (isPending) return <p className="text-text-secondary">Membaca database…</p>;
  if (idols.length === 0) return <EmptyState icon={Users} title="Belum ada idol" description="Tambahkan idol lewat Input Data." />;
  return (
    <div className="space-y-6">
      <PageHeader tag="Idol Database" title="Semua idol dalam satu tempat" note="Saring, urutkan, lalu buka profil." />
      <IdolFilters idols={idols} filter={filter} onFilter={setFilter} view={view} onView={setView} />
      <p className="m-0 text-sm text-text-secondary" aria-live="polite">{shown.length} dari {idols.length} idol</p>
      {shown.length === 0
        ? <EmptyState icon={SearchX} title="Tidak ada idol yang cocok" action={<Button onClick={() => setFilter(NO_FILTER)}>Hapus filter</Button>} />
        : view === "grid" ? <IdolDatabaseGrid ids={shown.map((i) => i.id)} /> : <IdolDatabaseTable idols={shown} leagueOf={leagueOf} />}
    </div>
  );
}
