// Swiss Play-in as a bracket (PRD §9; Update 2: drawn whole from the start): five round columns, each round split
// into its record buckets (0–0; 1–0 / 0–1; …) with every slot shown, blank until the match exists. An open match is
// clickable. Result column: 3–0 / 3–1 go through, 3–2 goes to the LCQ, the rest are out (PRD §4).
import { type SwissMatch, swissRecords } from "@sabung/engine";
import { IdolPhoto } from "./IdolPhoto";
import { useIdolLookup } from "./idolSource";

const ROUNDS = 5;
const OUTCOME = (wins: number, losses: number) =>
  wins === 3 && losses <= 1 ? { label: "Through", color: "text-cool", fill: "bg-cool/15" }
    : wins === 3 ? { label: "LCQ", color: "text-accent-bright", fill: "bg-accent/20" }
      : { label: "Out", color: "text-danger", fill: "bg-danger/10" };
const choose = (n: number, k: number): number => (k === 0 || k === n ? 1 : choose(n - 1, k - 1) + choose(n - 1, k));

// Matches per record bucket before round r (0-based) in a group of `size`: wins + losses = r, nobody on 3 yet.
const buckets = (size: number, r: number) =>
  Array.from({ length: r + 1 }, (_, losses) => ({ wins: r - losses, losses, count: (size * choose(r, losses)) / 2 ** r / 2 }))
    .filter((b) => b.wins < 3 && b.losses < 3);

export type SwissOpen = { round: number; a: string; b: string; onOpen: () => void }; // round: 0-based

export function SwissPlayInBracket({ group, seededIds, rounds, open = [] }: { group: string; seededIds: string[]; rounds: SwissMatch[][]; open?: SwissOpen[] }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const final = swissRecords(seededIds, rounds.flat());
  const finalOrder = [...final].sort(([, x], [, y]) => y.wins - x.wins || x.losses - y.losses);

  return (
    <section aria-label={`Swiss group ${group}`} tabIndex={0} className="overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-accent-bright">
      <div className="flex gap-5">
        {Array.from({ length: ROUNDS }, (_, r) => {
          const before = swissRecords(seededIds, rounds.slice(0, r).flat());
          const rec = (id: string) => before.get(id)!;
          const played = rounds[r] ?? [];
          const waiting = open.filter((m) => m.round === r);
          return (
            <div key={r} className="w-48 shrink-0">
              <h3 className="m-0 mb-2 bg-surface-hover/60 px-2 py-1 text-[10px] font-bold tracking-[0.2em] uppercase">Round {r + 1}</h3>
              {buckets(seededIds.length, r).map((b) => {
                const mine = (m: { a: string }) => rec(m.a).wins === b.wins && rec(m.a).losses === b.losses;
                const done = played.filter(mine);
                const next = waiting.filter(mine);
                const blanks = Math.max(0, b.count - done.length - next.length);
                return (
                  <div key={`${b.wins}-${b.losses}`} className="mb-3">
                    <h4 className="m-0 mb-1 font-gothic text-lg leading-none text-accent-bright">{b.wins}–{b.losses}</h4>
                    <ul className="m-0 list-none space-y-1 p-0">
                      {done.map((m) => {
                        const [sa, sb] = m.score?.split("–") ?? [];
                        return (
                          <li key={`${m.a}-${m.b}`} className="bg-surface/80 p-0.5 text-xs">
                            {([m.a, m.b] as const).map((id, i) => (
                              <span key={id} className={`flex items-center gap-1.5 pr-1 ${id === m.winner ? "bg-accent/30 font-bold text-text-primary" : "text-text-secondary"}`}>
                                <IdolPhoto idolId={id} size={64} className="h-6 w-5 shrink-0" />
                                <span className="flex-1 truncate">{name(id)}</span>
                                <span className={`w-4 text-center font-mono tabular-nums ${id === m.winner ? "text-accent-bright" : ""}`}>{i === 0 ? (sa ?? "") : (sb ?? "")}</span>
                              </span>
                            ))}
                          </li>
                        );
                      })}
                      {next.map((m) => (
                        <li key={`${m.a}-${m.b}`}>
                          <button type="button" onClick={m.onOpen} className="block w-full bg-surface-hover/70 p-0.5 text-left text-xs hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
                            <span className="sr-only">Play </span>
                            {[m.a, m.b].map((id, i) => <span key={id} className="flex items-center gap-1.5"><IdolPhoto idolId={id} size={64} className="h-6 w-5 shrink-0" /><span className="truncate">{name(id)}</span>{i === 0 && <span className="sr-only"> vs </span>}</span>)}
                          </button>
                        </li>
                      ))}
                      {Array.from({ length: blanks }, (_, i) => <li key={`blank-${i}`} aria-hidden="true" className="h-[3.25rem] bg-surface/30" />)}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="w-52 shrink-0">
          <h3 className="m-0 mb-2 bg-surface-hover/60 px-2 py-1 text-[10px] font-bold tracking-[0.2em] uppercase">Results</h3>
          <ul className="m-0 list-none space-y-1 p-0" aria-label="Swiss results">
            {finalOrder.map(([id, r]) => {
              const outcome = OUTCOME(r.wins, r.losses);
              const decided = r.wins === 3 || r.losses === 3;
              return (
                <li key={id} className={`${decided ? outcome.fill : "bg-surface/40"} flex justify-between gap-2 px-2 py-1 text-xs`}>
                  <span className="truncate text-text-primary">{name(id)}</span>
                  <span className={`font-mono tabular-nums ${decided ? outcome.color : "text-text-secondary"}`}>{r.wins}–{r.losses}{decided ? ` ${outcome.label}` : ""}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
