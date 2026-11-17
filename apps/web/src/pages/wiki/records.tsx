// All-time Records (PRD §8, §7.3): one leaderboard card per category, biggest upsets and most H2H meetings.
// Minimum matches for percentages is adjustable; a name search hides rows but keeps the global rank.
import { rankLabel } from "@sabung/engine";
import { useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LEAGUE_ARENAS } from "../../components/competition/arenaTheme";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { AwardRecords } from "../../components/records/AwardRecords";
import { RecordCard, type RecordRow } from "../../components/records/RecordCard";
import { IdolLink } from "../../components/wiki/IdolLink";
import { engine } from "../../data/engineClient";
import { PageHeader } from "../../components/PageHeader";

export const Route = createFileRoute("/wiki/records")({ component: AllTimeRecords });

function AllTimeRecords() {
  const [minMatches, setMinMatches] = useState("50");
  const [search, setSearch] = useState("");
  const lookup = useIdolLookup();
  const { data, isPending } = useQuery({ queryKey: ["records", minMatches], queryFn: () => engine().records(Number(minMatches)), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const { data: awards = [] } = useQuery({ queryKey: ["award-history"], queryFn: () => engine().awardHistory(), staleTime: 0, enabled: typeof Worker !== "undefined" });
  if (isPending || !data) return <p className="text-text-secondary">Crunching the records…</p>;
  const q = search.trim().toLowerCase();
  const hit = (...ids: string[]) => !q || ids.some((id) => lookup(id)?.name.toLowerCase().includes(q));
  const cards: { title: string; rows: RecordRow[] }[] = [
    ...data.categories.map((c) => ({
      title: c.label,
      rows: c.entries.filter((e) => hit(e.idolId)).map((e) => ({ key: e.idolId, idolId: e.idolId, rank: rankLabel(e), who: <IdolLink id={e.idolId} />, value: c.kind === "percent" ? `${(e.value * 100).toFixed(1)}%` : String(e.value) })),
    })),
    {
      title: "Biggest upset (rating gap)",
      rows: data.upsets.filter((u) => hit(u.winner, u.loser)).map((u) => ({ key: u.matchId, idolId: u.winner, rank: rankLabel(u), who: <><IdolLink id={u.winner} /> <span className="text-text-secondary">vs</span> <IdolLink id={u.loser} /> <span className="text-text-secondary">S{u.season}</span></>, value: `+${u.value}` })),
    },
    {
      title: "Most H2H meetings",
      rows: data.meetings.filter((m) => hit(...m.idolId.split("|"))).map((m) => {
        const [a, b] = m.idolId.split("|") as [string, string];
        return { key: m.idolId, rank: rankLabel(m), who: <><IdolLink id={a} /> <span className="text-text-secondary">vs</span> <IdolLink id={b} /></>, value: String(m.value) };
      }),
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader tag="Records" title="All-time records" note="Every category is ranked; search a name without changing the ranks." />
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-text-secondary">
          Search a name
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="mt-1 block rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-2 py-1 text-text-primary" />
        </label>
        <Select label="Minimum matches (% records)" value={minMatches} onChange={setMinMatches} options={["10", "25", "50", "100", "200"].map((n): [string, string] => [n, n])} />
      </div>
      <AwardRecords history={awards} hit={(id) => hit(id)} />
      <h2 className="kicker m-0">Career records</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, i) => <RecordCard key={c.title} title={c.title} rows={c.rows} arena={LEAGUE_ARENAS[i % 6]!.arena} />)}
      </div>
    </div>
  );
}
