// Idol Profile (PRD §8): hero, then tabs Overview, Career, Seasons, Matches, Rivals, Records.
// Everything is read from the Worker in one call (idolProfile) except the paged match log.
import { EmptyState, VirtualTable } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { UserX } from "lucide-react";
import { Tabs } from "../../../components/competition/Tabs";
import { CareerScope } from "../../../components/idolProfile/CareerScope";
import { ProfileEdit } from "../../../components/idolProfile/ProfileEdit";
import { ProfileHero } from "../../../components/idolProfile/ProfileHero";
import { ProfileOverview } from "../../../components/idolProfile/ProfileOverview";
import { ProfileRecords } from "../../../components/idolProfile/ProfileRecords";
import { ProfileGallery } from "../../../components/idolProfile/ProfileGallery";
import { ProfileRivals } from "../../../components/idolProfile/ProfileRivals";
import { ProfileSeasons } from "../../../components/idolProfile/ProfileSeasons";
import { CAREER_COLUMNS } from "../../../components/wiki/careerColumns";
import { compLabel } from "../../../components/wiki/compLabel";
import { MatchLog } from "../../../components/wiki/MatchLog";
import { engine } from "../../../data/engineClient";
import { IDOLS_QUERY } from "../../../data/IdolDataProvider";
import { useCurrentSeason, useLeagueRosters } from "../../../data/seasonQuery";

export const Route = createFileRoute("/wiki/idols/$id")({ component: IdolProfile });

function IdolProfile() {
  const { id } = Route.useParams();
  const { data: idols, isPending } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  const { data: profile } = useQuery({ queryKey: ["idol-profile", id], queryFn: () => engine().idolProfile(id), staleTime: 0, enabled: typeof Worker !== "undefined" });
  const rosters = useLeagueRosters(useCurrentSeason()?.id);
  const idol = idols?.find((i) => i.id === id);

  if (isPending) return <p className="text-text-secondary">Loading database…</p>;
  if (!idol) return <EmptyState icon={UserX} title="Idol not found" description="This idol doesn't exist (maybe it was deleted)." />;
  const league = Object.entries(rosters ?? {}).find(([, ids]) => ids.includes(id))?.[0];
  const all = profile?.rows.find((r) => r.comp === "ALL");
  return (
    <div className="space-y-10">
      <ProfileHero idol={idol} idolIds={idols!.map((i) => i.id)} league={league}
        record={{ titles: all?.titles ?? 0, podiums: (all?.titles ?? 0) + (all?.runnerUp ?? 0) + (all?.third ?? 0), matches: all?.matches ?? 0, wins: all?.wins ?? 0, draws: all?.draws ?? 0, losses: all?.losses ?? 0, winRate: all?.winRate ?? 0 }} />
      <ProfileEdit idol={idol} />
      {!profile ? <p className="text-text-secondary">Crunching the numbers…</p> : (
        <Tabs label="Idol profile" tabs={[
          { id: "overview", label: "Overview", content: () => <ProfileOverview badges={profile.badges} titles={profile.placements.filter((p) => p.finalRank === 1)} history={profile.ratingHistory} rating={idol.rating} /> },
          { id: "career", label: "Career", content: () => (
            <div className="space-y-10">
            <CareerScope rows={profile.rows} />
            <VirtualTable rows={[...profile.rows].sort((a, b) => (a.comp === "ALL" ? -1 : b.comp === "ALL" ? 1 : b.matches - a.matches))} rowKey={(r) => r.comp} label="Career by competition" height="none"
              columns={[{ header: "Competition", cell: (r) => compLabel(r.comp), className: "whitespace-nowrap font-medium" }, ...CAREER_COLUMNS.map((c) => ({ header: c.header, cell: c.value, className: "font-mono tabular-nums whitespace-nowrap" }))]} />
            </div>
          ) },
          { id: "seasons", label: "Seasons", content: () => <ProfileSeasons placements={profile.placements} /> },
          { id: "matches", label: "Matches", content: () => <MatchLog filter={{ idolId: id }} label={`Match ${idol.name}`} /> },
          { id: "rivals", label: "Rivals", content: () => <ProfileRivals idolId={id} rivals={profile.rivals} /> },
          { id: "records", label: "Records", content: () => <ProfileRecords records={profile.records} /> },
          { id: "gallery", label: `Gallery (${idol.gallery.length})`, content: () => <ProfileGallery idolId={idol.id} name={idol.name} photos={idol.gallery} /> },
        ]} />
      )}
    </div>
  );
}
