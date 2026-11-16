// The last card of a Simulation Timeline: the champion(s), who goes up and who goes down, the champion's path in a cup,
// each competition's stories (or, with none, its plain summary), and one or two "story of the season" lines.
import type { Finale, TimelineStory, TitleNews } from "@sabung/engine";
import { IdolPhoto } from "@sabung/ui";
import { headlineOf, kickerOf, toneOf } from "./timelineText";

type Name = (id: string) => string;

// A competition's stories; with none, its summary, so a finale never shows only a name.
export const storiesOf = (n: TitleNews): TimelineStory[] => (n.stories.length ? n.stories : n.summary ? [n.summary] : []);

export function NewsItem({ s, tag, name, label }: { s: TimelineStory; tag?: string; name: Name; label: Name }) {
  return (
    <li lang="id" className="border-l-2 pl-3" style={{ borderColor: toneOf(s) }}>
      <span className="block text-xs font-bold tracking-[0.2em] uppercase" style={{ color: toneOf(s) }}>{kickerOf(s)}{tag ? ` · ${tag}` : ""}</span>
      <span className="block font-display text-base">{headlineOf(s, name, label)}</span>
    </li>
  );
}

export function Names({ title, ids, name, tone }: { title: string; ids: string[]; name: Name; tone: string }) {
  if (!ids.length) return null;
  return (
    <div>
      <p className="m-0 text-xs tracking-widest uppercase" style={{ color: `var(--color-${tone})` }}>{title}</p>
      <p className="m-0 text-sm">{ids.map(name).join(", ")}</p>
    </div>
  );
}

export function TimelineFinale({ finale, name, label }: { finale: Finale; name: Name; label: Name }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="kicker m-0">Finale</p>
      {finale.news && finale.news.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Biggest news">
          {finale.news.flatMap((n) => storiesOf(n).map((s) => <NewsItem key={`${n.title}|${s.kind}`} s={s} tag={label(n.title)} name={name} label={label} />))}
        </ul>
      )}
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Champions">
        {finale.champions.map((c) => (
          <li key={c.title} className="flex items-center gap-3">
            <IdolPhoto idolId={c.idol} size={256} className="photo-frame w-14 shrink-0" />
            <span className="min-w-0"><span className="block text-xs tracking-widest text-text-secondary uppercase">{label(c.title)}</span><span className="block font-display text-base uppercase">{name(c.idol)}</span></span>
          </li>
        ))}
      </ul>
      <Names title="Promoted" ids={finale.promoted} name={name} tone="cool" />
      <Names title="Relegated" ids={finale.relegated} name={name} tone="danger" />
      {finale.path.length > 0 && (
        <ol className="m-0 list-none space-y-1 p-0 text-sm" aria-label="Path to the title">
          {finale.path.map((s) => <li key={s.matchId}><span className="font-mono text-text-secondary">{s.round}</span> {s.won ? "beat" : "lost to"} {name(s.opponent)} <span className="font-mono">{s.score}</span></li>)}
        </ol>
      )}
      {finale.lines.map((s, i) => <p key={i} lang="id" className="m-0 border-t border-border pt-2 text-sm text-text-secondary">{headlineOf(s, name, label)}</p>)}
    </div>
  );
}
