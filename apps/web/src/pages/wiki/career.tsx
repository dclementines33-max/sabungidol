// Career Stats (PRD §8, §7.1): Combined + one tab per competition, chosen columns, scope (§7.3: status,
// group, league), sort and CSV. (Season-range scope is not built: the cache keeps career totals only.)
import type { CareerRow } from "@sabung/engine";
import { D1_LEAGUES, D2_LEAGUES, SEASON_COMPETITIONS } from "@sabung/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CAREER_SORTS, CareerTable } from "../../components/careerStats/CareerTable";
import { Tabs } from "../../components/competition/Tabs";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { NO_FILTER, filterIdols } from "../../components/idolDatabase/filterIdols";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { useCurrentSeason, useLeagueRosters } from "../../data/seasonQuery";

export const Route = createFileRoute("/wiki/career")({ component: CareerStats });

function CareerStats() {
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const rosters = useLeagueRosters(useCurrentSeason()?.id);
  const [scope, setScope] = useState({ status: "", group: "", league: "" });
  const [sort, setSort] = useState<keyof CareerRow>("titles");
  const leagueOf = useMemo(() => new Map(Object.entries(rosters ?? {}).flatMap(([comp, ids]) => ids.map((id) => [id, comp] as const))), [rosters]);
  const allowed = useMemo(() => new Set(filterIdols(idols, leagueOf, { ...NO_FILTER, ...scope }).map((i) => i.id)), [idols, leagueOf, scope]);
  const groups = [...new Map(idols.flatMap((i) => (i.groupId ? [[i.groupId, i.groupName!] as [string, string]] : []))).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const set = (key: keyof typeof scope) => (value: string) => setScope({ ...scope, [key]: value });
  const tabs = [{ key: "ALL", name: "Combined" }, ...SEASON_COMPETITIONS];
  return (
    <div className="space-y-6">
      <header>
        <p className="m-0"><span className="tag">Career Stats</span></p>
        <h2 className="m-0 mt-3 text-[clamp(2.5rem,7vw,5rem)]">Catatan karier</h2>
        <p className="m-0 text-text-secondary">Statistik tiap tab mengikuti formatnya: Swiss dan LCQ tanpa gelar, Unzure dengan lolos/gugur grup, cup knockout dengan posisi terbaik.</p>
      </header>
      <div role="group" aria-label="Scope" className="flex flex-wrap items-end gap-3">
        <Select label="Status" value={scope.status} onChange={set("status")} options={[["", "Semua"], ["active", "Aktif"], ["inactive", "Nonaktif"]]} />
        <Select label="Group" value={scope.group} onChange={set("group")} options={[["", "Semua"], ...groups, ["solo", "Soloist"]]} />
        <Select label="Liga" value={scope.league} onChange={set("league")} options={[["", "Semua"], ...[...D1_LEAGUES, ...D2_LEAGUES].map((c): [string, string] => [c, c]), ["reserve", "Cadangan"]]} />
        <Select label="Urutkan" value={sort} onChange={(v) => setSort(v as keyof CareerRow)} options={CAREER_SORTS} />
      </div>
      <Tabs label="Kompetisi" tabs={tabs.map((t) => ({ id: t.key, label: t.name, content: () => <CareerTable key={t.key} comp={t.key} label={t.name} allowed={allowed} sort={sort} /> }))} />
    </div>
  );
}
