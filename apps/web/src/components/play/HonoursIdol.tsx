// One honoured idol of the season (2026-11-16 redesign: no boxes): a huge outlined place number behind the framed photo,
// the name, a row of big season numbers, titles as tags, every final place, and the news that names her (the first two,
// then "show all"). Used for the top 3 and the Unzure Cup champion; wide (the Unzure champion) = photo left, the rest
// across the full width from lg up.
import type { AnyStory } from "@sabung/engine";
import { IdolPhoto, useIdol } from "@sabung/ui";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import type { engine } from "../../data/engineClient";
import { StoryCard } from "../story/StoryCard";
import { SeasonStatLine } from "./SeasonStatLine";

export type HonoursDetail = Awaited<ReturnType<ReturnType<typeof engine>["podiumDetail"]>>[number];
const NEWS_SHOWN = 2;

export function HonoursIdol({ d, kicker, mark, lead = false, wide = false, stories }: { d: HonoursDetail; kicker: string; mark: string; lead?: boolean; wide?: boolean; stories: AnyStory[] }) {
  const { label } = useBranding();
  const idol = useIdol(d.id);
  const [allNews, setAllNews] = useState(false);
  const delta = d.rating ? d.rating.new - d.rating.old : null;
  return (
    <article className={`flex min-w-0 flex-col items-center gap-4 text-center ${wide ? "lg:flex-row lg:items-start lg:gap-12 lg:text-left" : ""}`} aria-label={`${kicker}: ${idol.name}`}>
      <div className="relative">
        <p aria-hidden="true" className={`outline-text pointer-events-none absolute top-0 right-[70%] -z-10 m-0 font-display leading-none ${lead ? "text-ornament-xl" : "text-ornament-xl"}`}>{mark}</p>
        <IdolPhoto idolId={d.id} size={1024} className={`photo-frame ${lead ? "w-56 shadow-[0_0_90px_-10px_var(--color-accent-bright)] sm:w-72" : "w-40 sm:w-48"}`} />
      </div>
      <div className={`flex w-full min-w-0 flex-col items-center gap-4 ${wide ? "lg:flex-1 lg:items-start" : ""}`}>
      <div>
        <p className="kicker m-0">{kicker}</p>
        <h3 className={`m-0 font-display uppercase ${lead ? "text-headline" : "text-xl"}`}>{idol.name}</h3>
      </div>
      <SeasonStatLine d={d} wide={wide} />
      {delta !== null && <p className={`-mt-2 m-0 text-sm ${delta > 0 ? "text-cool" : delta < 0 ? "text-danger" : "text-muted"}`}>{delta > 0 ? `+${delta}` : delta} rating this season</p>}
      {d.titles.length > 0 && <ul aria-label="Titles" className={`m-0 flex list-none flex-wrap justify-center gap-2 p-0 ${wide ? "lg:justify-start" : ""}`}>{d.titles.map((t) => <li key={t} className="tag bg-accent text-on-accent">{label(t)}</li>)}</ul>}
      {d.places.length > 0 && (
        <ul aria-label="Final places" className={`m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-sm text-text-secondary ${wide ? "lg:justify-start" : "max-w-md"}`}>
          {d.places.map((p) => <li key={p.comp}><span className={p.rank === 1 ? "text-accent-bright" : "text-text-primary"}>#{p.rank}</span> {label(p.comp)}</li>)}
        </ul>
      )}
      {stories.length > 0 && (
        <div className={`w-full text-left ${wide ? "" : "max-w-md"}`}>
          <ul aria-label="In the news" className={`m-0 list-none p-0 ${wide ? "grid gap-3 md:grid-cols-2" : "space-y-3"}`}>{(allNews ? stories : stories.slice(0, NEWS_SHOWN)).map((s, i) => <li key={i}><StoryCard story={s} /></li>)}</ul>
          {stories.length > NEWS_SHOWN && (
            <button type="button" aria-expanded={allNews} onClick={() => setAllNews(!allNews)} className="mt-3 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright">
              {allNews ? "Show less" : `Show all ${stories.length} news`}
            </button>
          )}
        </div>
      )}
      </div>
    </article>
  );
}
