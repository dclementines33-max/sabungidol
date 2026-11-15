// One honoured idol of the season (2026-11-16 redesign: no boxes): a huge outlined place number behind the framed photo,
// the name, a row of big season numbers, titles as tags, every final place, and the news that names her (the first two,
// then "show all"). Used for the top 3 and the Unzure Cup champion.
import type { AnyStory } from "@sabung/engine";
import { IdolPhoto, useIdol } from "@sabung/ui";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import type { engine } from "../../data/engineClient";
import { StoryCard } from "../story/StoryCard";

export type HonoursDetail = Awaited<ReturnType<ReturnType<typeof engine>["podiumDetail"]>>[number];
const NEWS_SHOWN = 2;

export function HonoursIdol({ d, kicker, mark, lead = false, stories }: { d: HonoursDetail; kicker: string; mark: string; lead?: boolean; stories: AnyStory[] }) {
  const { label } = useBranding();
  const idol = useIdol(d.id);
  const [allNews, setAllNews] = useState(false);
  const r = d.record;
  const delta = d.rating ? d.rating.new - d.rating.old : null;
  const stats: [string, string][] = [
    ["W-D-L", `${r.wins}-${r.draws}-${r.losses}`],
    ["Win rate", `${(r.winRate * 100).toFixed(1)}%`],
    ["Titles", String(d.titles.length)],
    ["Games", `${r.gamesWon}–${r.gamesLost}`],
    ["Best run", `${r.bestStreak}W`],
    ["Rating", d.rating ? `${d.rating.old} → ${d.rating.new}` : String(d.startRating ?? idol.rating)],
  ];
  return (
    <article className="flex min-w-0 flex-col items-center gap-4 text-center" aria-label={`${kicker}: ${idol.name}`}>
      <div className="relative">
        <p aria-hidden="true" className={`outline-text pointer-events-none absolute top-0 right-[70%] -z-10 m-0 font-display leading-none ${lead ? "text-[clamp(8rem,18vw,14rem)]" : "text-[clamp(6rem,12vw,9rem)]"}`}>{mark}</p>
        <IdolPhoto idolId={d.id} size={1024} className={`photo-frame ${lead ? "w-56 shadow-[0_0_90px_-10px_var(--color-accent-bright)] sm:w-72" : "w-40 sm:w-48"}`} />
      </div>
      <div>
        <p className="kicker m-0">{kicker}</p>
        <h3 className={`m-0 font-display uppercase ${lead ? "text-[clamp(2rem,4vw,3rem)]" : "text-xl"}`}>{idol.name}</h3>
      </div>
      <dl className="m-0 grid w-full max-w-md grid-cols-3 gap-x-4 gap-y-3 border-y border-border py-3">
        {stats.map(([k, v]) => (
          <div key={k}><dt className="text-xs tracking-widest text-text-secondary uppercase">{k}</dt><dd className="m-0 font-display text-base whitespace-nowrap tabular-nums sm:text-lg">{v}</dd></div>
        ))}
      </dl>
      {delta !== null && <p className={`-mt-2 m-0 text-sm ${delta > 0 ? "text-cool" : delta < 0 ? "text-danger" : "text-muted"}`}>{delta > 0 ? `+${delta}` : delta} rating this season</p>}
      {d.titles.length > 0 && <ul aria-label="Titles" className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">{d.titles.map((t) => <li key={t} className="tag bg-accent text-on-accent">{label(t)}</li>)}</ul>}
      {d.places.length > 0 && (
        <ul aria-label="Final places" className="m-0 flex max-w-md list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-sm text-text-secondary">
          {d.places.map((p) => <li key={p.comp}><span className={p.rank === 1 ? "text-accent-bright" : "text-text-primary"}>#{p.rank}</span> {label(p.comp)}</li>)}
        </ul>
      )}
      {stories.length > 0 && (
        <div className="w-full max-w-md text-left">
          <ul aria-label="In the news" className="m-0 list-none space-y-3 p-0">{(allNews ? stories : stories.slice(0, NEWS_SHOWN)).map((s, i) => <li key={i}><StoryCard story={s} /></li>)}</ul>
          {stories.length > NEWS_SHOWN && (
            <button type="button" aria-expanded={allNews} onClick={() => setAllNews(!allNews)} className="mt-3 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright">
              {allNews ? "Show less" : `Show all ${stories.length} news`}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
