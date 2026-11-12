// A league's 38 matchdays (PRD §8): scores of played matches; open ones can be played one by one or
// as a whole matchday. Matchdays are folded so the page stays short.
import { Button, useIdolLookup } from "@sabung/ui";

type Fixture = { id: string; idolA: string; idolB: string; scoreA?: number; scoreB?: number };

export function LeagueFixtures({ fixtures, busy, onPlay }: {
  fixtures: { round: string; matches: Fixture[] }[];
  busy: boolean;
  onPlay: (what: { round: string } | { id: string }) => void;
}) {
  const lookup = useIdolLookup();
  const firstOpen = fixtures.find((f) => f.matches.some((m) => m.scoreA === undefined))?.round;
  return (
    <div className="space-y-2">
      {fixtures.map(({ round, matches }) => {
        const open = matches.filter((m) => m.scoreA === undefined).length;
        return (
          <details key={round} open={round === firstOpen} className="rounded-card border border-border bg-bg-raised">
            <summary className="flex cursor-pointer items-center gap-3 px-3 py-2">
              <span className="font-mono">Matchday {Number(round.slice(2))}</span>
              <span className="text-sm text-text-secondary">{open ? `${open} belum dimainkan` : "selesai"}</span>
            </summary>
            <div className="space-y-1 px-3 pb-3">
              {open > 0 && <Button className="px-2 py-1" disabled={busy} onClick={() => onPlay({ round })}>Main matchday {Number(round.slice(2))}</Button>}
              <ul className="m-0 list-none space-y-1 p-0 text-sm">
                {matches.map((m) => (
                  <li key={m.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                    <span className="truncate text-right">{lookup(m.idolA)?.name}</span>
                    <span className="w-14 text-center font-mono tabular-nums">{m.scoreA === undefined ? "–" : `${m.scoreA}–${m.scoreB}`}</span>
                    <span className="truncate">{lookup(m.idolB)?.name}</span>
                    {m.scoreA === undefined
                      ? <Button className="px-2 py-0.5 text-xs" disabled={busy} aria-label={`Main ${lookup(m.idolA)?.name} lawan ${lookup(m.idolB)?.name}`} onClick={() => onPlay({ id: m.id })}>Main</Button>
                      : <span />}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        );
      })}
    </div>
  );
}
