// Legacy wildcard play-in (PRD §9), only for old archives. Read-only rounds of matches.
// The PRD gives no format for the old data; this shows rounds → matches (two idols, winner, score).
import { useIdolLookup } from "./idolSource";

export type WildcardRound = { label: string; matches: { a: string; b: string; winner?: string; score?: string }[] };

export function WildcardPlayInBracket({ rounds }: { rounds: WildcardRound[] }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  return (
    <section aria-label="Wildcard play-in (arsip lama)" className="overflow-x-auto">
      <p className="m-0 mb-2 text-xs text-text-secondary">Format lama · hanya arsip</p>
      <div className="flex gap-4">
        {rounds.map((round) => (
          <div key={round.label} className="w-44 shrink-0">
            <h3 className="m-0 mb-2 font-mono text-xs text-text-secondary">{round.label}</h3>
            <ul className="m-0 list-none space-y-1 p-0">
              {round.matches.map((m) => (
                <li key={`${m.a}-${m.b}`} className="rounded-control border border-border bg-surface px-2 py-1 text-xs">
                  {[m.a, m.b].map((id) => (
                    <span key={id} className={`${id === m.winner ? "font-semibold text-accent-gold" : "text-text-secondary"} block truncate`}>{name(id)}</span>
                  ))}
                  {m.score && <span className="font-mono text-text-secondary tabular-nums">{m.score}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
