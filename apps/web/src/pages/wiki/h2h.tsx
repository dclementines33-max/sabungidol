// Head to Head (PRD §8): pick two idols (kept in the URL: ?a=&b=), compare, the top 10 rivalries, and the
// direct match log filtered by competition and season.
import { SEASON_COMPETITIONS } from "@sabung/shared";
import { SearchableIdolSelect } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { H2HCompare } from "../../components/h2h/H2HCompare";
import { TopRivalries } from "../../components/h2h/TopRivalries";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { MatchLog } from "../../components/wiki/MatchLog";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";

const id = (v: unknown) => (typeof v === "string" && v ? v : undefined);
export const Route = createFileRoute("/wiki/h2h")({ validateSearch: (s): { a?: string; b?: string } => ({ a: id(s.a), b: id(s.b) }), component: HeadToHead });

function HeadToHead() {
  const { a, b } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const { data } = useQuery({ queryKey: ["h2h", a, b], queryFn: () => engine().headToHead(a, b), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const { data: seasons = [] } = useQuery({ queryKey: ["season-list"], queryFn: () => engine().seasonList(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const [comp, setComp] = useState("");
  const [season, setSeason] = useState("");
  const ids = idols.map((i) => i.id);
  const pick = (side: "a" | "b") => (v: string | null) => navigate({ search: (s) => ({ ...s, [side]: v ?? undefined }), replace: true });
  return (
    <div className="space-y-10">
      <div key={`${idols.length}|${a}|${b}`} className="grid gap-4 sm:grid-cols-2">
        <SearchableIdolSelect label="First idol" idolIds={ids.filter((i) => i !== b)} value={a ?? null} onChange={pick("a")} />
        <SearchableIdolSelect label="Second idol" idolIds={ids.filter((i) => i !== a)} value={b ?? null} onChange={pick("b")} />
      </div>
      {a && b && a !== b && data && ( // an idol against herself has nothing to compare
        <>
          <H2HCompare a={a} b={b} pair={data.pair} lineA={data.lineA} lineB={data.lineB} games={data.games as [number, number]} formA={data.formA as ("W" | "D" | "L")[]} formB={data.formB as ("W" | "D" | "L")[]} />
          <section aria-labelledby="direct" className="space-y-3">
            <h2 id="direct" className="m-0 font-display text-xl uppercase">Direct Match Log ({data.pair?.meetings ?? 0} Matches)</h2>
            <div className="flex flex-wrap gap-3">
              <Select label="Competition" value={comp} onChange={setComp} options={[["", "All"], ...SEASON_COMPETITIONS.map((c): [string, string] => [c.key, c.name])]} />
              <Select label="Season" value={season} onChange={setSeason} options={[["", "All"], ...seasons.map((s): [string, string] => [s.id, s.name])]} />
            </div>
            <MatchLog label="Head-to-head matches" filter={{ idolId: a, vsId: b, seasonId: season || undefined, comps: SEASON_COMPETITIONS.find((c) => c.key === comp)?.codes }} />
          </section>
        </>
      )}
      {data && <TopRivalries top={data.top} />}
    </div>
  );
}
