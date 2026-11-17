// One girl group's page (Fase 6 step 9): its logo (upload / replace), name huge, the members as cards, then the same
// record, titles per competition and member table as the Girl Group Stats list.
import { Button, IdolCard } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { CompetitionLogo } from "../../components/CompetitionLogo";
import { GroupEntry } from "../../components/groups/GroupEntry";
import { useMama } from "../../components/groups/useMama";
import { groupStats } from "../../components/groups/groupStats";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";

export const Route = createFileRoute("/wiki/group/$id")({ component: GroupPage });

const on = typeof Worker !== "undefined";

function GroupPage() {
  const { id } = Route.useParams();
  const picker = useRef<HTMLInputElement>(null);
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: on });
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => engine().listGroups(), enabled: on });
  const { data: combined } = useQuery({ queryKey: ["career-table", "ALL"], queryFn: () => engine().careerTable("ALL"), staleTime: 0, enabled: on });
  const { data: titles = [] } = useQuery({ queryKey: ["titles-by-comp"], queryFn: () => engine().titlesByComp(), staleTime: 0, enabled: on });
  const stats = useMemo(() => groupStats(idols, combined ?? [], titles), [idols, combined, titles]);
  const career = useMemo(() => new Map((combined ?? []).map((r) => [r.idolId, r])), [combined]);
  const mama = useMama();
  const g = stats.find((x) => x.id === id);
  const base = groups.find((x) => x.id === id); // Update 3: a new group has a page before it has members
  const logoId = base?.logoId;
  const name = g?.name ?? base?.name ?? "";
  if (!combined) return <p className="text-text-secondary">Crunching the numbers…</p>;
  if (!g && !base) return <p className="text-text-secondary">Group not found. <Link to="/wiki/groups" className="text-accent-bright underline">Back to Girl Group Stats</Link></p>;
  const upload = async (file: File) => {
    try {
      await engine().setGroupLogo(id, await engine().savePhoto(file));
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      notify({ level: "success", message: `${name} logo saved` });
    } catch (error) {
      notify({ level: "error", code: "E-GROUP-001", message: "Logo not saved.", context: error instanceof Error ? error.message : String(error) });
    }
  };
  return (
    <div className="space-y-10">
      <header className="relative isolate flex flex-wrap items-end gap-6">
        <p aria-hidden="true" className="outline-text pointer-events-none absolute -top-4 right-0 -z-10 m-0 font-display text-[clamp(4rem,14vw,10rem)] leading-none whitespace-nowrap opacity-40">{name}</p>
        <CompetitionLogo logoId={logoId} className="size-28" />
        <div>
          <p className="m-0"><span className="tag">{g ? `Girl group #${stats.indexOf(g) + 1}` : "New girl group"}</span></p>
          <h2 className="m-0 mt-3 text-[clamp(2.5rem,8vw,6rem)] leading-none">{name}</h2>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => picker.current?.click()}>{logoId ? "Replace logo" : "Upload logo"}</Button>
            <input ref={picker} type="file" accept="image/*" hidden aria-label={`Logo ${name}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          </div>
        </div>
      </header>
      {!g && <p className="m-0 text-text-secondary">No members yet. Add idols in Input Data with this group name.</p>}
      {g && <>
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0" aria-label={`${g.name} member cards`}>
          {g.members.map((m) => <li key={m}><Link to="/wiki/idols/$id" params={{ id: m }} className="block focus-visible:outline-2 focus-visible:outline-accent-bright"><IdolCard idolId={m} /></Link></li>)}
        </ul>
        <ol className="m-0 list-none p-0"><GroupEntry rank={stats.indexOf(g) + 1} g={g} logoId={logoId} open onToggle={() => {}} career={career} titles={titles} mama={mama(id)} /></ol>
      </>}
    </div>
  );
}
