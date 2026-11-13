// Home (PRD §8). The first season's draft: the onboarding welcome. Otherwise the cinematic Home: hero with
// the last Unzure champion, three action cards, On This Day, idols On Fire and the last backup.
import { IdolPhoto } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { HomeActions } from "../components/home/HomeActions";
import { HomeHero } from "../components/home/HomeHero";
import { OnThisDay } from "../components/home/OnThisDay";
import { Welcome } from "../components/home/Welcome";
import { IdolLink } from "../components/wiki/IdolLink";
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
      <HomeActions progress={o.progress} status={o.season.status} next={o.next} story={stories?.find((s) => s.kind === "upset") ?? stories?.[0]} />
      <OnThisDay matches={o.onThisDay} />
      <section aria-labelledby="on-fire" className="space-y-2">
        <p className="kicker m-0">Menang beruntun 5+</p>
        <h2 id="on-fire" className="m-0 text-[clamp(2rem,4vw,3rem)]">On Fire</h2>
        {o.onFire.length === 0 ? <p className="m-0 text-sm text-text-secondary">Tidak ada idol dengan 5+ kemenangan beruntun.</p>
          : <ul className="m-0 flex list-none gap-5 overflow-x-auto p-0 pb-2 text-sm">{o.onFire.map((f) => (
              <li key={f.idolId} className="relative w-24 shrink-0 text-center">
                <IdolPhoto idolId={f.idolId} size={256} className="torn w-24" />
                <span className="absolute top-0 right-1 font-gothic text-2xl text-accent-bright drop-shadow-[0_2px_6px_rgb(0_0_0/0.9)]">{f.streak}</span>
                <IdolLink id={f.idolId} className="mt-1 block truncate" />
              </li>
            ))}</ul>}
      </section>
      <p className="m-0 text-sm text-text-secondary">
        {o.lastBackup ? `Backup terakhir ${daysAgo(o.lastBackup)} hari lalu.` : "Belum pernah backup."}{" "}
        <Link to="/studio/settings" className="text-accent-bright underline underline-offset-4">Buka Backup</Link>
      </p>
    </div>
  );
}
