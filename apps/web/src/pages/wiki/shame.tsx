// Hall of Shame (2026-11-18): the all-time records nobody wants — losses, skids, finals lost, paper tigers, cursed
// matchups, the biggest falls — as "most wanted" posters. Minimum matches for the rate-based lists is adjustable.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Select } from "../../components/idolDatabase/IdolFilters";
import { ShameCard } from "../../components/shame/ShameCard";
import { engine } from "../../data/engineClient";

export const Route = createFileRoute("/wiki/shame")({ component: HallOfShame });

const TILT = [-4, 3, -2, 5, -5, 2]; // posters pinned crooked

function HallOfShame() {
  const [minMatches, setMinMatches] = useState("20");
  const { data } = useQuery({ queryKey: ["hall-of-shame", minMatches], queryFn: () => engine().hallOfShame(Number(minMatches)), staleTime: 0, enabled: typeof Worker !== "undefined" });
  if (!data) return <p className="text-text-secondary">Digging up the evidence…</p>;
  return (
    <div className="space-y-8">
      <PageHeader tag="Hall of Shame" title="The records nobody wants" note="Losing streaks, finals thrown away, paper tigers and cursed matchups. All in good fun: every champion has a page in here somewhere." />
      <Select label="Minimum matches (rates, paper tigers)" value={minMatches} onChange={setMinMatches} options={["10", "20", "50", "100"].map((n): [string, string] => [n, n])} />
      {data.length === 0
        ? <p className="m-0 text-text-secondary">No shame yet. Play some matches and it will come.</p>
        : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.map((c, i) => <ShameCard key={c.id} c={c} tilt={TILT[i % TILT.length]!} />)}</div>}
    </div>
  );
}
