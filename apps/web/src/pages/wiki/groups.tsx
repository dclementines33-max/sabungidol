// Girl Group Stats (PRD §8; Update 2): groups ranked by titles as an editorial list — the top three bigger — each with
// its record, titles per competition and members; opening a group shows how each member performed. Update 3: a panel
// with a second tab, every group (logo, members) and a form to add a new one.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Tabs } from "../../components/competition/Tabs";
import { AllGroups } from "../../components/groups/AllGroups";
import { GroupEntry } from "../../components/groups/GroupEntry";
import { groupStats } from "../../components/groups/groupStats";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";

export const Route = createFileRoute("/wiki/groups")({ component: GirlGroupStats });

const on = typeof Worker !== "undefined";

function GirlGroupStats() {
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: on });
  const { data: combined } = useQuery({ queryKey: ["career-table", "ALL"], queryFn: () => engine().careerTable("ALL"), staleTime: 0, enabled: on });
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => engine().listGroups(), enabled: on });
  const { data: titles = [] } = useQuery({ queryKey: ["titles-by-comp"], queryFn: () => engine().titlesByComp(), staleTime: 0, enabled: on });
  const stats = useMemo(() => groupStats(idols, combined ?? [], titles), [idols, combined, titles]);
  const career = useMemo(() => new Map((combined ?? []).map((r) => [r.idolId, r])), [combined]);
  const [open, setOpen] = useState<string | null>(null);
  const logoOf = new Map(groups.map((g) => [g.id, g.logoId]));
  if (!combined) return <p className="text-text-secondary">Crunching the numbers…</p>;
  return (
    <div className="space-y-8">
      <header>
        <p className="m-0 flex items-center gap-3"><span className="tag">Girl Group Stats</span><span className="kicker">{groups.length} groups</span></p>
        <h2 className="m-0 mt-3 text-[clamp(2.5rem,7vw,5rem)]">Girl group rankings</h2>
        <p className="m-0 text-text-secondary">Ranked by the members' total titles. Click a group for each member's numbers.</p>
      </header>
      <Tabs label="Girl group" tabs={[
        { id: "rank", label: "Rankings", content: () => (
          <ol className="m-0 list-none p-0">
            {stats.map((g, i) => <GroupEntry key={g.id} rank={i + 1} g={g} logoId={logoOf.get(g.id)} open={open === g.id} onToggle={() => setOpen(open === g.id ? null : g.id)} career={career} titles={titles} />)}
          </ol>
        ) },
        { id: "all", label: "All groups", content: () => <AllGroups groups={groups} idols={idols} /> },
      ]} />
    </div>
  );
}
