// A girl group's page opener (2026-11-18 richer group page): a spotlit stage with the logo, the name huge (and again as a
// giant outline), its places (titles ranking, Sabung Index) and the numbers that matter as a scoreboard strip.
import type { ReactNode } from "react";
import { CompetitionLogo } from "../CompetitionLogo";

export type HeroStat = { label: string; value: string };

export function GroupHero({ name, logoId, tags, stats, children }: { name: string; logoId?: string | null; tags: string[]; stats: HeroStat[]; children?: ReactNode }) {
  return (
    <header className="stage relative isolate overflow-hidden rounded-card px-5 pt-8 pb-6 sm:px-8">
      <span aria-hidden="true" className="pointer-events-none absolute -top-16 left-10 -z-10 h-[140%] w-80 -rotate-12 bg-[linear-gradient(180deg,rgb(240_199_94/0.18),transparent_70%)] blur-sm" />
      <p aria-hidden="true" className="outline-text pointer-events-none absolute -right-4 bottom-0 -z-10 m-0 font-display text-ornament-xl leading-none whitespace-nowrap opacity-25">{name}</p>
      <div className="flex flex-wrap items-end gap-6">
        <span className="grid size-28 shrink-0 place-items-center rounded-card bg-bg-base/70 shadow-[0_0_60px_-16px_var(--color-winner)] sm:size-36">
          {logoId ? <CompetitionLogo logoId={logoId} className="size-24 sm:size-32" /> : <span aria-hidden="true" className="font-gothic text-5xl text-winner">{name.slice(0, 2)}</span>}
        </span>
        <div className="min-w-0">
          <p className="m-0 flex flex-wrap gap-2">{tags.map((t, i) => <span key={t} className={i === 0 ? "tag" : "tag bg-winner"}>{t}</span>)}</p>
          <h2 className="m-0 mt-3 text-hero leading-none break-words [text-shadow:0_6px_36px_rgb(255_77_99/0.3)]">{name}</h2>
          {children && <div className="mt-3 flex gap-2">{children}</div>}
        </div>
      </div>
      {stats.length > 0 && (
        <dl className="m-0 mt-6 flex flex-wrap gap-x-8 gap-y-4">
          {stats.map((s) => (
            <div key={s.label} className="border-l-2 border-accent-bright/50 pl-3">
              <dd className="score m-0 text-2xl whitespace-nowrap sm:text-3xl">{s.value}</dd>
              <dt className="kicker text-text-secondary">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
