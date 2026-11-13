// Match Database (PRD §8): every saved match, in id order (= grouped by season, competition and stage),
// filtered by season, competition, stage, idol and result, newest or oldest first, 50 at a time with a
// cursor and the number of results. Never loads everything at once.
import { SEASON_COMPETITIONS, STAGE_CODES } from "@sabung/shared";
import { Button, SearchableIdolSelect } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { MatchLog } from "../../components/wiki/MatchLog";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { PageHeader } from "../../components/PageHeader";

export const Route = createFileRoute("/wiki/matches")({ component: MatchDatabase });

const NONE = { season: "", comp: "", stage: "", idol: null as string | null, result: "", order: "newest" };

function MatchDatabase() {
  const [f, setF] = useState(NONE);
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const { data: seasons = [] } = useQuery({ queryKey: ["season-list"], queryFn: () => engine().seasonList(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const set = (key: keyof typeof NONE) => (value: string | null) => setF({ ...f, [key]: value, ...(key === "idol" && !value && f.result !== "D" ? { result: "" } : {}) });
  const results: [string, string][] = [["", "Semua"], ["D", "Seri"], ...(f.idol ? [["W", "Menang"], ["L", "Kalah"]] as [string, string][] : [])];
  return (
    <div className="space-y-4">
      <PageHeader tag="Match Database" title="Semua match yang pernah dimainkan" note="Saring per kompetisi, season, idol dan hasil." />
      <div role="group" aria-label="Filter match" className="flex flex-wrap items-end gap-3">
        <Select label="Season" value={f.season} onChange={set("season")} options={[["", "Semua"], ...seasons.map((s): [string, string] => [s.id, s.name])]} />
        <Select label="Kompetisi" value={f.comp} onChange={set("comp")} options={[["", "Semua"], ...SEASON_COMPETITIONS.map((c): [string, string] => [c.key, c.name])]} />
        <Select label="Stage" value={f.stage} onChange={set("stage")} options={[["", "Semua"], ...Object.entries(STAGE_CODES).map(([code, name]): [string, string] => [code, name])]} />
        <div key={f.idol === null ? "none" : "idol"} className="w-64"><SearchableIdolSelect label="Idol" idolIds={idols.map((i) => i.id)} value={f.idol} onChange={set("idol")} /></div>
        <Select label="Hasil" value={f.result} onChange={set("result")} options={results} />
        <Select label="Urutan" value={f.order} onChange={set("order")} options={[["newest", "Season terbaru dulu"], ["oldest", "Season terlama dulu"]]} />
        <Button onClick={() => setF(NONE)}>Reset Filters</Button>
      </div>
      <MatchLog label="Hasil" newest={f.order === "newest"} filter={{
        seasonId: f.season || undefined, comps: SEASON_COMPETITIONS.find((c) => c.key === f.comp)?.codes, stage: f.stage || undefined,
        idolId: f.idol ?? undefined, result: (f.result || undefined) as "W" | "D" | "L" | undefined,
      }} />
    </div>
  );
}
