// The last card of a Simulation Timeline: the champion(s), who goes up and who goes down, the champion's path in a cup,
// and one or two "story of the season" lines.
import type { Finale } from "@sabung/engine";
import { IdolPhoto } from "@sabung/ui";
import { headlineOf } from "./timelineText";

type Name = (id: string) => string;

function Names({ title, ids, name, tone }: { title: string; ids: string[]; name: Name; tone: string }) {
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
