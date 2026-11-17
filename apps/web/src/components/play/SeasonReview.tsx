// The whole-season Simulation Timeline (2026-11-17 redesign, router task 1): a season review instead of a sideways track,
// so a full season reads at a glance — the three biggest headlines, every champion with one line, who went up and down,
// and a handful of key moments. Everything smaller is left out on purpose.
import { type AnyStory, type Timeline, newsScore } from "@sabung/engine";
import { IdolPhoto } from "@sabung/ui";
import { Names, NewsItem, storiesOf } from "./TimelineFinale";
import { headlineOf, isTrack, kickerOf, pointLabel, starOf, toneOf } from "./timelineText";

type Name = (id: string) => string;
const HEADLINES = 3;
const MOMENTS = 6;

export function SeasonReview({ t, name, label }: { t: Timeline; name: Name; label: Name }) {
  const news = t.finale?.news ?? [];
  const headlines = news.flatMap((n) => n.stories.slice(0, 1).map((s) => ({ s, comp: n.title }))).sort((a, b) => newsScore(b.s) - newsScore(a.s)).slice(0, HEADLINES); // one per competition
  const shown = new Set(headlines.map((h) => h.s));
  const moments = t.points.flatMap((p) => p.stories.flatMap((s) => (isTrack(s) ? [] : [{ s: s as AnyStory, p }])))
    .sort((a, b) => newsScore(b.s) - newsScore(a.s)).slice(0, MOMENTS);
  return (
    <div className="space-y-8">
      {headlines.length > 0 && (
        <section aria-label="Season headlines">
          <h3 className="section-title text-xl">Headlines of the season</h3>
          <ol className="m-0 mt-3 grid list-none gap-4 p-0 md:grid-cols-3">
            {headlines.map(({ s, comp }) => (
              <li key={`${comp}|${s.kind}`} className="stage flex flex-col gap-3 rounded-card p-5" style={{ boxShadow: `inset 0 3px 0 ${toneOf(s)}` }}>
                <IdolPhoto idolId={starOf(s)} size={256} className="photo-frame w-28" />
                <span lang="id" className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: toneOf(s) }}>{kickerOf(s)} · {label(comp)}</span>
                <span lang="id" className="font-display text-xl leading-tight">{headlineOf(s, name, label)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {news.length > 0 && (
        <section aria-label="Champions">
          <h3 className="section-title text-xl">Champions</h3>
          <ul className="m-0 mt-3 grid list-none gap-x-6 gap-y-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => {
              const line = storiesOf(n).find((s) => !shown.has(s as AnyStory)) ?? n.summary;
              return (
                <li key={n.title} className="panel flex items-start gap-4 p-4">
                  <IdolPhoto idolId={n.summary?.idol ?? starOf(n.stories[0]!)} size={256} className="photo-frame w-16 shrink-0" />
                  <span className="min-w-0">
                    <span className="kicker block text-winner">{label(n.title)}</span>
                    <span className="block font-display text-lg uppercase">{name(n.summary?.idol ?? starOf(n.stories[0]!))}</span>
                    {line && <span lang="id" className="block text-sm text-text-secondary">{headlineOf(line, name, label)}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {t.finale && (t.finale.promoted.length > 0 || t.finale.relegated.length > 0) && (
        <section aria-label="Promotion and relegation" className="panel grid gap-4 p-4 sm:grid-cols-2">
          <Names title="Promoted" ids={t.finale.promoted} name={name} tone="cool" />
          <Names title="Relegated" ids={t.finale.relegated} name={name} tone="danger" />
        </section>
      )}
      {moments.length > 0 && (
        <section aria-label="Key moments">
          <h3 className="section-title text-xl">Key moments</h3>
          <ul className="m-0 mt-3 grid list-none gap-3 p-0 md:grid-cols-2">
            {moments.map(({ s, p }, i) => <NewsItem key={i} s={s} tag={pointLabel(p, label, true)} name={name} label={label} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
