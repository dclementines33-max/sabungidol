// Swiss Play-in grid (PRD §9): one column per round, matches grouped by record (0–0, 1–0, 0–1 …),
// and a result column: 3–0 / 3–1 go through, 3–2 goes to the LCQ, the rest are out (PRD §4).
import { type SwissMatch, swissRecords } from "@sabung/engine";
import { useIdolLookup } from "./idolSource";

const OUTCOME = (wins: number, losses: number) =>
  wins === 3 && losses <= 1 ? { label: "Lolos", color: "text-accent-sage border-accent-sage" }
    : wins === 3 ? { label: "LCQ", color: "text-accent-gold border-accent-gold" }
      : { label: "Gugur", color: "text-danger border-danger" };

export function SwissPlayInBracket({ group, seededIds, rounds }: { group: string; seededIds: string[]; rounds: SwissMatch[][] }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const record = (history: SwissMatch[], id: string) => {
    const r = swissRecords(seededIds, history).get(id)!;
    return `${r.wins}–${r.losses}`;
  };
  const final = swissRecords(seededIds, rounds.flat());
  const finalOrder = [...final].sort(([, x], [, y]) => y.wins - x.wins || x.losses - y.losses);

  return (
    <section aria-label={`Swiss grup ${group}`} className="overflow-x-auto">
      <div className="flex gap-4">
        {rounds.map((matches, r) => {
          const before = rounds.slice(0, r).flat();
          const byRecord = new Map<string, SwissMatch[]>();
          for (const m of matches) byRecord.set(record(before, m.a), [...(byRecord.get(record(before, m.a)) ?? []), m]);
          return (
            <div key={r} className="w-44 shrink-0">
              <h3 className="m-0 mb-2 font-mono text-xs text-text-secondary">Ronde {r + 1}</h3>
              {[...byRecord].map(([rec, list]) => (
                <div key={rec} className="mb-3">
                  <h4 className="m-0 mb-1 font-mono text-xs tabular-nums">{rec}</h4>
                  <ul className="m-0 list-none space-y-1 p-0">
                    {list.map((m) => (
                      <li key={`${m.a}-${m.b}`} className="rounded-control border border-border bg-surface px-2 py-1 text-xs">
                        {[m.a, m.b].map((id) => (
                          <span key={id} className={`${id === m.winner ? "font-semibold text-accent-gold" : "text-text-secondary"} block truncate`}>{name(id)}</span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
        <div className="w-44 shrink-0">
          <h3 className="m-0 mb-2 font-mono text-xs text-text-secondary">Hasil</h3>
          <ul className="m-0 list-none space-y-1 p-0" aria-label="Hasil Swiss">
            {finalOrder.map(([id, r]) => {
              const outcome = OUTCOME(r.wins, r.losses);
              return (
                <li key={id} className={`${outcome.color} flex justify-between rounded-control border-l-2 bg-surface px-2 py-1 text-xs`}>
                  <span className="truncate text-text-primary">{name(id)}</span>
                  <span className="font-mono tabular-nums">{r.wins}–{r.losses} {outcome.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
