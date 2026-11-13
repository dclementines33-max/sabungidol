// Dashboard (PRD §8; user decision: a fixed card order, no drag): season & phase, competition progress,
// reigning champions, most titles, top 5 rating, On Fire (form), biggest upset this season, rating
// distribution, top girl groups, matches saved and storage. ("Records just broken" is not built.)
import { tierOf } from "@sabung/shared";
import { IdolPhoto, RatingBadge, StatTile } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CompetitionProgress } from "../components/dashboard/CompetitionProgress";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import { RatingHistogram } from "../components/dashboard/RatingHistogram";
import { groupStats } from "../components/groups/groupStats";
import { useBranding } from "../data/branding";
import { IdolLink } from "../components/wiki/IdolLink";
import { engine } from "../data/engineClient";
import { IDOLS_QUERY } from "../data/IdolDataProvider";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const on = typeof Worker !== "undefined";
const LIST = "m-0 list-none space-y-1 p-0 text-sm";

function Dashboard() {
  const { label } = useBranding();
  const { data: o } = useQuery({ queryKey: ["overview"], queryFn: () => engine().overview(), staleTime: 0, enabled: on });
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: on });
  const { data: combined = [] } = useQuery({ queryKey: ["career-table", "ALL"], queryFn: () => engine().careerTable("ALL"), staleTime: 0, enabled: on });
  const { data: storage } = useQuery({ queryKey: ["storage-estimate"], queryFn: () => navigator.storage.estimate(), staleTime: 0, enabled: on });
  if (!o) return <p className="text-text-secondary">Membaca season…</p>;
  const active = idols.filter((i) => i.active);
  const mostTitles = [...combined].sort((a, b) => b.titles - a.titles || b.wins - a.wins)[0];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <DashboardCard title="Season & fase">
        <p className="m-0 font-display text-2xl uppercase">{o.season.name}</p>
        <p className="m-0 text-sm text-text-secondary">{o.season.status} · {o.played} match · {Math.round(o.progress * 100)}% kompetisi selesai</p>
      </DashboardCard>
      <DashboardCard title="Progress kompetisi"><CompetitionProgress competitions={o.competitions} /></DashboardCard>
      <DashboardCard title="Juara bertahan">
        {o.reigning.length === 0 ? <p className="m-0 text-sm text-text-secondary">Belum ada juara.</p> : (
          <ul className="m-0 grid max-h-64 list-none grid-cols-2 gap-2 overflow-auto p-0 text-sm">
            {o.reigning.map((t) => <li key={t.key} className="flex items-center gap-2"><IdolPhoto idolId={t.champion} size={64} className="w-8" /><span className="min-w-0"><IdolLink id={t.champion} /><span className="block truncate text-xs text-text-secondary">{label(t.key)}</span></span></li>)}
          </ul>
        )}
      </DashboardCard>
      <DashboardCard title="Gelar terbanyak">
        {mostTitles?.titles ? <div className="flex items-center gap-3"><IdolPhoto idolId={mostTitles.idolId} size={256} className="w-20" /><div><IdolLink id={mostTitles.idolId} className="font-display text-xl uppercase" /><p className="m-0 font-mono text-3xl">{mostTitles.titles}</p></div></div> : <p className="m-0 text-sm text-text-secondary">Belum ada gelar.</p>}
      </DashboardCard>
      <DashboardCard title="Top 5 rating">
        <ol className={LIST}>{[...active].sort((a, b) => b.rating - a.rating).slice(0, 5).map((i) => <li key={i.id} className="flex items-center gap-2"><RatingBadge rating={i.rating} /><IdolLink id={i.id} className="flex-1" /><span className="text-text-secondary">Tier {tierOf(i.rating)}</span></li>)}</ol>
      </DashboardCard>
      <DashboardCard title="On Fire (5+ menang beruntun)">
        {o.onFire.length === 0 ? <p className="m-0 text-sm text-text-secondary">Tidak ada yang sedang on fire.</p>
          : <ul className={LIST}>{o.onFire.map((f) => <li key={f.idolId} className="flex"><IdolLink id={f.idolId} className="flex-1" /><span className="font-mono">{f.streak}×</span></li>)}</ul>}
      </DashboardCard>
      <DashboardCard title="Upset terbesar season ini">
        {o.upset ? <p className="m-0"><IdolLink id={o.upset.winner} className="font-semibold" /> menumbangkan <IdolLink id={o.upset.loser} /> · selisih rating <span className="font-mono">{o.upset.gap}</span></p> : <p className="m-0 text-sm text-text-secondary">Belum ada upset.</p>}
      </DashboardCard>
      <DashboardCard title="Distribusi rating (idol aktif)"><RatingHistogram ratings={active.map((i) => i.rating)} /></DashboardCard>
      <DashboardCard title="Girl group teratas">
        <ol className={LIST}>{groupStats(idols, combined).slice(0, 5).map((g) => <li key={g.id} className="flex"><span className="flex-1">{g.name}</span><span className="font-mono">{g.titles} gelar · {(g.winRate * 100).toFixed(0)}%</span></li>)}</ol>
      </DashboardCard>
      <DashboardCard title="Data">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Match tersimpan" value={o.matches.toLocaleString("id-ID")} />
          <StatTile label="Storage" value={storage?.usage !== undefined ? `${(storage.usage / 1e6).toFixed(0)} MB` : "–"} />
        </div>
      </DashboardCard>
    </div>
  );
}
