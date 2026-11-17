// One girl group's page (Fase 6 step 9; 2026-11-18 richer): a stage opener with the logo (upload / replace), its places
// and numbers; the members as cards; member power (Sabung Index); the trophy road with the golden era; the award shelf;
// group wars (rival groups, favourite victim, bogey, civil war); then the record and member table as in Girl Group Stats.
import { Button, IdolCard } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { GroupAwards } from "../../components/groups/GroupAwards";
import { GroupEntry } from "../../components/groups/GroupEntry";
import { GroupHero } from "../../components/groups/GroupHero";
import { GroupRivals } from "../../components/groups/GroupRivals";
import { GroupTrophyTimeline } from "../../components/groups/GroupTrophyTimeline";
import { groupStats } from "../../components/groups/groupStats";
import { IndexLegend } from "../../components/ranking/IndexBar";
import { RankBoard } from "../../components/ranking/RankBoard";
import { groupIndex as groupIndexOf, idolIndex } from "../../components/ranking/sabungIndex";
import { useEntries } from "../../components/ranking/useEntries";
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
  const { data: awards = [] } = useQuery({ queryKey: ["award-history"], queryFn: () => engine().awardHistory(), staleTime: 0, enabled: on });
  const { data: champs = [] } = useQuery({ queryKey: ["champions"], queryFn: () => engine().champions(), staleTime: 0, enabled: on });
  const { data: matchups } = useQuery({ queryKey: ["group-matchups", id], queryFn: () => engine().groupMatchups(id), staleTime: 0, enabled: on });
  const entries = useEntries("idol");
  const stats = useMemo(() => groupStats(idols, combined ?? [], titles), [idols, combined, titles]);
  const career = useMemo(() => new Map((combined ?? []).map((r) => [r.idolId, r])), [combined]);
  const index = useMemo(() => idolIndex(idols, combined ?? [], titles, awards), [idols, combined, titles, awards]);
  const byGroup = useMemo(() => groupIndexOf(idols, index, awards), [idols, index, awards]);
  const info = useMemo(() => new Map([
    ...groups.map((x) => [x.id, { name: x.name, logoId: x.logoId }] as const),
    ...idols.flatMap((i) => (i.groupId ? [[i.groupId, { name: i.groupName ?? i.groupId, logoId: i.groupLogoId }] as const] : [])),
  ]), [groups, idols]);
  const g = stats.find((x) => x.id === id);
  const base = info.get(id); // Update 3: a new group has a page before it has members
  const logoId = base?.logoId;
  const name = g?.name ?? base?.name ?? "";
  if (!combined) return <p className="text-text-secondary">Crunching the numbers…</p>;
  if (!g && !base) return <p className="text-text-secondary">Group not found. <Link to="/wiki/groups" className="text-accent-bright underline">Back to Girl Group Stats</Link></p>;
  const upload = async (file: File) => {
    try {
      await engine().setGroupLogo(id, await engine().savePhoto(file));
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
      notify({ level: "success", message: `${name} logo saved` });
    } catch (error) {
      notify({ level: "error", code: "E-GROUP-001", message: "Logo not saved.", context: error instanceof Error ? error.message : String(error) });
    }
  };
  const members = new Set(g?.members ?? []);
  const mama = awards.filter((a) => a.key === "mama" && a.id === id).map((a) => a.season);
  const place = byGroup.findIndex((r) => r.id === id);
  const memberRows = entries ? index.filter((r) => members.has(r.id)).map((row) => ({ entry: entries.byId.get(row.id)!, row })) : [];
  const heroStats = g ? [
    { label: "Titles", value: String(g.titles) }, { label: "MAMA", value: String(mama.length) },
    { label: "Win rate", value: g.matches ? `${(g.winRate * 100).toFixed(1)}%` : "–" }, { label: "W–D–L", value: `${g.wins}–${g.draws}–${g.losses}` },
    { label: "Avg rating", value: g.avgRating.toFixed(1) }, { label: "Members", value: String(g.members.length) },
  ] : [];
  const tags = g ? [`Girl group #${stats.indexOf(g) + 1} by titles`, ...(place >= 0 ? [`Sabung Index #${place + 1} · ${byGroup[place]!.score.toFixed(1)}`] : [])] : ["New girl group"];
  return (
    <div className="space-y-10">
      <GroupHero name={name} logoId={logoId} tags={tags} stats={heroStats}>
        <Button onClick={() => picker.current?.click()}>{logoId ? "Replace logo" : "Upload logo"}</Button>
        <input ref={picker} type="file" accept="image/*" hidden aria-label={`Logo ${name}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      </GroupHero>
      {!g && <p className="m-0 text-text-secondary">No members yet. Add idols in Input Data with this group name.</p>}
      {g && <>
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0" aria-label={`${g.name} member cards`}>
          {g.members.map((m) => <li key={m}><Link to="/wiki/idols/$id" params={{ id: m }} className="block focus-visible:outline-2 focus-visible:outline-accent-bright"><IdolCard idolId={m} /></Link></li>)}
        </ul>
        {memberRows.length > 0 && (
          <section aria-labelledby="member-power" className="space-y-3">
            <h3 id="member-power" className="section-title m-0">Member power</h3>
            <p className="m-0 text-sm text-text-secondary">Each member's Sabung Index; the group's own is its best four plus MAMA.</p>
            <IndexLegend />
            <RankBoard rows={memberRows} from={1} max={memberRows[0]!.row.score} />
          </section>
        )}
        <GroupTrophyTimeline titles={champs.filter((c) => members.has(c.champion))} />
        <GroupAwards wins={awards.filter((a) => a.key !== "mama" && members.has(a.id))} mama={mama} />
        {matchups && <GroupRivals rivals={matchups.rivals} civil={matchups.civil} groups={info} />}
        <ol className="m-0 list-none p-0"><GroupEntry rank={stats.indexOf(g) + 1} g={g} logoId={logoId} open onToggle={() => {}} career={career} titles={titles} mama={mama} /></ol>
      </>}
    </div>
  );
}
