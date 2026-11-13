// Girl Group Stats (PRD §8): a table of groups; choosing one shows its member grid. (Groups have no logo yet.)
import { IdolCard } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { groupStats } from "../../components/groups/groupStats";
import { IdolLink } from "../../components/wiki/IdolLink";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";

export const Route = createFileRoute("/wiki/groups")({ component: GirlGroupStats });

function GirlGroupStats() {
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const { data: combined } = useQuery({ queryKey: ["career-table", "ALL"], queryFn: () => engine().careerTable("ALL"), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const stats = useMemo(() => groupStats(idols, combined ?? []), [idols, combined]);
  const [open, setOpen] = useState<string | null>(null);
  const group = stats.find((g) => g.id === open);
  if (!combined) return <p className="text-text-secondary">Menghitung statistik…</p>;
  return (
    <div className="space-y-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead><tr className="text-left text-text-secondary">{["Group", "Member aktif", "Gelar", "Win rate", "Member terbaik", "Rata rating"].map((h) => <th key={h} scope="col" className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {stats.map((g) => (
              <tr key={g.id} className="border-t border-border">
                <td className="px-2 py-1"><button type="button" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? null : g.id)} className="text-left font-medium text-accent-bright underline underline-offset-4">{g.name}</button></td>
                <td className="px-2 py-1 font-mono">{g.active}/{g.members.length}</td>
                <td className="px-2 py-1 font-mono">{g.titles}</td>
                <td className="px-2 py-1 font-mono">{(g.winRate * 100).toFixed(1)}%</td>
                <td className="px-2 py-1"><IdolLink id={g.best} /></td>
                <td className="px-2 py-1 font-mono">{g.avgRating.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {group && (
        <section aria-labelledby="group-name" className="space-y-3">
          <h2 id="group-name" className="m-0 font-display text-2xl uppercase">{group.name}</h2>
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0" aria-label={`Member ${group.name}`}>
            {group.members.map((id) => <li key={id}><Link to="/wiki/idols/$id" params={{ id }} className="block rounded-card focus-visible:outline-2 focus-visible:outline-accent-bright"><IdolCard idolId={id} /></Link></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
