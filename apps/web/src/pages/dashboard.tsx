// Dashboard (PRD §8; Update 2): the season as a cover (name, phase, progress), the last Unzure champion (moved from Home
// 2026-11-15), Divisi 1's title race and table, the map
// of every competition's order and format, then loose columns: competition progress, top 5 rating, biggest upset,
// rating distribution, top girl groups, data. No grid of boxes.
import { tierOf } from "@sabung/shared";
import { RatingBadge, StatTile } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChampionCover } from "../components/dashboard/ChampionCover";
import { SectionBoundary } from "../components/SectionBoundary";
import { CompetitionProgress } from "../components/dashboard/CompetitionProgress";
import { D1Board } from "../components/dashboard/D1Board";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import { RatingHistogram } from "../components/dashboard/RatingHistogram";
import { StorageTile } from "../components/dashboard/StorageTile";
import { TournamentMap } from "../components/dashboard/TournamentMap";
import { groupStats } from "../components/groups/groupStats";
import { IdolLink } from "../components/wiki/IdolLink";
import { engine } from "../data/engineClient";
import { IDOLS_QUERY } from "../data/IdolDataProvider";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const on = typeof Worker !== "undefined";
const LIST = "m-0 list-none space-y-1 p-0 text-sm";

function Dashboard() {
  const { data: o } = useQuery({ queryKey: ["overview"], queryFn: () => engine().overview(), staleTime: 0, enabled: on });
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: on });
  const { data: combined = [] } = useQuery({ queryKey: ["career-table", "ALL"], queryFn: () => engine().careerTable("ALL"), staleTime: 0, enabled: on });
  const { data: storage } = useQuery({ queryKey: ["storage-estimate"], queryFn: () => navigator.storage.estimate(), staleTime: 0, enabled: on });
  if (!o) return <p className="text-text-secondary">Loading season…</p>;
  const active = idols.filter((i) => i.active);
  const phase = o.competitions.find((c) => c.status === "running" || c.status === "next");
  return (
    <div className="space-y-16">
      <header className="relative isolate">
        <p aria-hidden="true" className="outline-text pointer-events-none absolute -top-14 right-0 -z-10 m-0 font-display text-ornament leading-none opacity-30">{Math.round(o.progress * 100)}%</p>
        <p className="m-0 flex flex-wrap items-center gap-3"><span className="tag">Dashboard</span><span className="kicker">{o.season.status === "live" ? "Live" : o.season.status}</span></p>
        <h2 className="m-0 mt-3 text-hero">{o.season.name}</h2>
        <p className="m-0 text-lg text-text-secondary">{o.played.toLocaleString("en-GB")} matches · {Math.round(o.progress * 100)}% competitions done{phase ? ` · now: ${phase.name}` : ""}</p>
      </header>
      <SectionBoundary name="Unzure champion"><ChampionCover seasonName={o.season.name} champion={o.lastUnzure?.champion ?? null} championSeason={o.lastUnzure?.season} /></SectionBoundary>
      {o.season.status === "live" ? <SectionBoundary name="Division 1"><D1Board /></SectionBoundary> : <p className="m-0 text-text-secondary">Division 1 standings appear once the season starts.</p>}
      <SectionBoundary name="Season map"><TournamentMap /></SectionBoundary>
      <div className="columns-1 gap-10 md:columns-2 xl:columns-3">
        <DashboardCard title="Competition progress"><CompetitionProgress competitions={o.competitions} /></DashboardCard>
        <DashboardCard title="Top 5 rating">
          <ol className={LIST}>{[...active].sort((a, b) => b.rating - a.rating).slice(0, 5).map((i) => <li key={i.id} className="flex items-center gap-2"><RatingBadge rating={i.rating} /><IdolLink id={i.id} className="flex-1" /><span className="text-text-secondary">Tier {tierOf(i.rating)}</span></li>)}</ol>
        </DashboardCard>
        <DashboardCard title="Biggest upset this season">
          {o.upset ? <p className="m-0 text-lg"><IdolLink id={o.upset.winner} className="font-display" /> beat <IdolLink id={o.upset.loser} /> · rating gap <span className="font-gothic text-2xl text-accent-bright">{o.upset.gap}</span></p> : <p className="m-0 text-sm text-text-secondary">No upsets yet.</p>}
        </DashboardCard>
        <DashboardCard title="Rating spread (active idols)"><RatingHistogram ratings={active.map((i) => i.rating)} /></DashboardCard>
        <DashboardCard title="Top girl groups">
          <ol className={LIST}>{groupStats(idols, combined).slice(0, 5).map((g) => <li key={g.id} className="flex"><span className="flex-1">{g.name}</span><span className="font-mono">{g.titles} titles · {(g.winRate * 100).toFixed(0)}%</span></li>)}</ol>
        </DashboardCard>
        <DashboardCard title="Data">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Matches saved" value={o.matches.toLocaleString("en-GB")} />
            <StorageTile usage={storage?.usage} quota={storage?.quota} />
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
