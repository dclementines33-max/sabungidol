// A cup's Simulation results as a news page (2026-11-17, user: "not a timeline, news, nicely laid out"): round by round,
// in the order they were played, each round's stories as news cards — the very first one as the lead, large — and the
// finale (champion, path, title news) last, so reading down the page never gives the winner away early.
import type { Timeline, TimelineStory } from "@sabung/engine";
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useBranding } from "../../data/branding";
import { arenaOf } from "../competition/arenaTheme";
import { TimelineFinale } from "./TimelineFinale";
import { headlineOf, kickerOf, pointLabel, starOf, toneOf } from "./timelineText";

function Card({ s, lead, name, label }: { s: TimelineStory; lead: boolean; name: (id: string) => string; label: (k: string) => string }) {
  return (
    <li className={`flex gap-4 ${lead ? "stage flex-col rounded-card p-5 sm:col-span-2 sm:flex-row sm:items-end lg:col-span-3" : "panel p-4"}`} style={{ boxShadow: `inset 0 3px 0 ${toneOf(s)}` }}>
      <IdolPhoto idolId={starOf(s)} size={lead ? 256 : 64} className={lead ? "photo-frame w-44 shrink-0 sm:w-56" : "photo-frame w-16 shrink-0 self-start"} />
      <span lang="id" className="min-w-0">
        <span className="block text-xs font-bold tracking-[0.2em] uppercase" style={{ color: toneOf(s) }}>{kickerOf(s)}</span>
        <span className={`block font-display leading-tight ${lead ? "mt-2 text-headline" : "mt-1 text-base"}`}>{headlineOf(s, name, label)}</span>
      </span>
    </li>
  );
}

export function TrackNews({ t }: { t: Timeline }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  return (
    <div data-arena={arenaOf(t.track!)} className="space-y-10">
      {t.points.map((p, i) => (
        <section key={`${p.comp}${p.stage}${p.round}`} aria-label={pointLabel(p, label, false)} className="space-y-4">
          <h3 className="m-0 flex items-center gap-3"><span className="chip bg-accent text-on-accent"><span>{pointLabel(p, label, false)}</span></span><span aria-hidden="true" className="h-0.5 flex-1 bg-[linear-gradient(90deg,var(--color-accent-bright),transparent)]" /></h3>
          <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {p.stories.map((s, j) => <Card key={j} s={s} lead={i === 0 && j === 0} name={name} label={label} />)}
          </ul>
        </section>
      ))}
      {t.finale && (
        <section aria-label="Finale" className="stage rounded-card p-5 shadow-[inset_0_3px_0_var(--color-winner),0_0_60px_-20px_var(--color-winner)] sm:p-8">
          <TimelineFinale finale={t.finale} name={name} label={label} />
        </section>
      )}
    </div>
  );
}
