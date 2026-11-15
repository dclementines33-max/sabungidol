// Season Honours: what each of the season's top 3 did — season record, rating change, every final place and the
// news that names her (the same StoryCard as Season Story). One expandable card per idol.
import { IdolPhoto, useIdol } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { StoryCard } from "../story/StoryCard";

const MEDAL = ["1st", "2nd", "3rd"];

function Card({ place, d }: { place: number; d: Awaited<ReturnType<ReturnType<typeof engine>["podiumDetail"]>>[number] }) {
  const { label } = useBranding();
  const idol = useIdol(d.id);
  const { wins, draws, losses, winRate } = d.record;
  const delta = d.rating ? d.rating.new - d.rating.old : null;
  return (
    <li className="panel p-4">
      <details open={place === 0}>
        <summary className="flex cursor-pointer items-center gap-3 focus-visible:outline-2 focus-visible:outline-accent-bright">
          <IdolPhoto idolId={d.id} size={64} className="h-14 w-11" />
          <span className="min-w-0 flex-1"><span className="kicker block">{MEDAL[place]}</span><span className="block truncate font-display text-lg">{idol.name}</span></span>
          <span className="font-mono text-sm">{wins}-{draws}-{losses} · {(winRate * 100).toFixed(1)}%</span>
        </summary>
        <dl className="m-0 mt-3 grid grid-cols-3 gap-2 text-center">
          <div><dt className="kicker">Win rate</dt><dd className="m-0 font-display text-xl tabular-nums">{(winRate * 100).toFixed(1)}%</dd></div>
          <div><dt className="kicker">Rating</dt><dd className="m-0 font-display text-xl tabular-nums">{d.rating ? `${d.rating.old} → ${d.rating.new}` : idol.rating}</dd></div>
          <div><dt className="kicker">Change</dt><dd className={`m-0 font-display text-xl tabular-nums ${delta ? (delta > 0 ? "text-cool" : "text-danger") : ""}`}>{delta === null ? "–" : delta > 0 ? `+${delta}` : delta}</dd></div>
        </dl>
        <h3 className="kicker mt-4 mb-1">Final places</h3>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-1 p-0 text-sm">
          {d.places.map((p) => <li key={p.comp} className={p.rank === 1 ? "text-brand-gold" : ""}>{label(p.comp)}: <span className="font-mono">#{p.rank}</span></li>)}
          {d.places.length === 0 && <li className="text-text-secondary">Final places are saved when the season is closed.</li>}
        </ul>
        {d.stories.length > 0 && (
          <>
            <h3 className="kicker mt-4 mb-2">In the news</h3>
            <ul className="m-0 list-none space-y-3 p-0">{d.stories.slice(0, 4).map((s, i) => <li key={i}><StoryCard story={s} /></li>)}</ul>
          </>
        )}
      </details>
    </li>
  );
}

export function PodiumDetail({ seasonId, top }: { seasonId: string; top: string[] }) {
  const { data } = useQuery({ queryKey: ["podium-detail", seasonId, top], queryFn: () => engine().podiumDetail(seasonId, top), staleTime: 0, enabled: typeof Worker !== "undefined" });
  if (!data) return null;
  return <ul aria-label="Top 3 details" className="m-0 grid list-none gap-3 p-0 lg:grid-cols-3">{data.map((d, i) => <Card key={d.id} place={i} d={d} />)}</ul>;
}
