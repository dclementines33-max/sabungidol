// Home (PRD §8). The first season's draft: the onboarding welcome. Otherwise the cinematic Home: hero with
// the last Unzure champion, action cards, On This Day, all-time numbers, a random fact, leaders and the last backup.
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { HomeActions } from "../components/home/HomeActions";
import { HomeFact } from "../components/home/HomeFact";
import { HomeLeaders } from "../components/home/HomeLeaders";
import { HomeNumbers } from "../components/home/HomeNumbers";
import { HomeHero } from "../components/home/HomeHero";
import { OnThisDay } from "../components/home/OnThisDay";
import { Welcome } from "../components/home/Welcome";
import { engine } from "../data/engineClient";
import { IDOLS_QUERY } from "../data/IdolDataProvider";
import { useCurrentSeason, useLeagueRosters } from "../data/seasonQuery";

export const Route = createFileRoute("/")({ component: Home });

const on = typeof Worker !== "undefined";
const daysAgo = (iso: string) => Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);

function Home() {
  const season = useCurrentSeason();
  const rosters = useLeagueRosters(season?.id) ?? {};
  const first = season?.status === "draft" && season.number === 1;
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: on });
  const { data: o } = useQuery({ queryKey: ["overview"], queryFn: () => engine().overview(), staleTime: 0, enabled: on && !!season && !first });
  const { data: stories } = useQuery({ queryKey: ["season-story", season?.id], queryFn: () => engine().seasonStory(season!.id), staleTime: 0, enabled: on && season?.status === "live" });
  if (!season) return <p className="text-text-secondary">Membaca season…</p>;
  if (first) {
    const placed = new Set(Object.values(rosters).flat());
    return <Welcome seasonName={season.name} idols={idols.length} leagues={Object.keys(rosters).length} reserves={idols.filter((i) => i.active && !placed.has(i.id)).length} />;
  }
  if (!o) return <p className="text-text-secondary">Membaca season…</p>;
  return (
    <div className="space-y-10">
      <HomeHero seasonName={o.season.name} champion={o.lastUnzure?.champion ?? null} championSeason={o.lastUnzure?.season} />
      <HomeActions progress={o.progress} status={o.season.status} story={stories?.find((s) => s.kind === "upset") ?? stories?.[0]} />
      <OnThisDay matches={o.onThisDay} />
      <HomeNumbers idols={o.totals.idols} groups={o.totals.groups} matches={o.matches} seasons={o.totals.seasonsDone} />
      <HomeFact facts={o.facts} />
      <HomeLeaders leaders={o.leaders} />
      <p className="m-0 text-sm text-text-secondary">
        {o.lastBackup ? `Backup terakhir ${daysAgo(o.lastBackup)} hari lalu.` : "Belum pernah backup."}{" "}
        <Link to="/studio/settings" className="text-accent-bright underline underline-offset-4">Buka Backup</Link>
      </p>
    </div>
  );
}
