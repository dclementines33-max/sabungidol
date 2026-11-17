// Home's current season (2026-11-15; was HomeActions): one block over the user's sky photo (design/assets → public/home)
// with the season name, the phase now, progress and a link to continue; beside it only the most important news (topNews).
import type { AnyStory } from "@sabung/engine";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { StoryCard } from "../story/StoryCard";

const BG = "linear-gradient(90deg, rgb(1 0 3 / 0.25), rgb(1 0 3 / 0.85) 50%, var(--color-bg-base) 90%), linear-gradient(0deg, rgb(37 67 93 / 0.6), transparent 60%), url(/home/sky.webp)";

type Props = { name: string; status: string; progress: number; played: number; phase?: string; news: AnyStory[] };

export function HomeSeason({ name, status, progress, played, phase, news }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <section aria-labelledby="season-now" className="grid gap-6 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
      <div className="relative isolate overflow-hidden rounded-card bg-cover bg-[position:30%_25%]" style={{ backgroundImage: BG }}>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bg-base/60 md:hidden" />
        <div className="ml-auto max-w-md space-y-4 px-5 py-8 sm:px-8">
          <p className="m-0 flex flex-wrap items-center gap-3"><span className="tag">This season</span><span className="kicker">{status === "live" ? "Live" : status}</span></p>
          <h2 id="season-now" className="m-0 text-headline leading-none">{name}</h2>
          <p className="m-0 text-text-secondary">{played.toLocaleString("en-GB")} matches{phase ? ` · now: ${phase}` : ""}</p>
          <p className="score m-0 text-hero leading-none">{pct}<span className="text-2xl">%</span></p>
          <span className="block h-3 -skew-x-12 overflow-hidden bg-bg-base/70" aria-hidden="true"><span className="block h-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-bright))] shadow-[0_0_20px_var(--color-accent-bright)]" style={{ width: `${pct}%` }} /></span>
          <Link to="/play" className="inline-flex -skew-x-12 items-center gap-2 rounded-[3px] bg-[linear-gradient(100deg,var(--color-accent),color-mix(in_oklab,var(--color-accent-bright)_30%,var(--color-accent)))] px-5 py-2 font-display text-on-accent shadow-[0_10px_30px_-10px_var(--color-accent-bright)] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-accent-bright">
            <span className="inline-flex skew-x-12 items-center gap-2">{status === "draft" ? "Start season" : "Continue season"} <ArrowRight aria-hidden="true" size={18} /></span>
          </Link>
        </div>
      </div>
      <section aria-labelledby="top-news" className="space-y-4">
        <div className="flex items-end justify-between gap-3"><h2 id="top-news" className="section-title">Top stories</h2><Link to="/story" className="text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary">All stories</Link></div>
        {news.length ? <ul className="m-0 list-none space-y-4 p-0">{news.map((s, i) => <li key={i} className="flex"><StoryCard story={s} /></li>)}</ul> : <p className="m-0 text-sm text-text-secondary">No stories this season yet.</p>}
      </section>
    </section>
  );
}
