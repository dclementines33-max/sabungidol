// A stage's matches grouped by round (Swiss, LCQ, group stage …): every open one opens the MatchModal.
import type { CupCell } from "../../data/seasonRunner";
import { MatchRow } from "./MatchRow";

export function MatchList({ cells, busy, onOpen, roundLabel = (r) => r }: {
  cells: CupCell[];
  busy: boolean;
  onOpen: (matchId: string) => void;
  roundLabel?: (round: string) => string;
}) {
  const rounds = [...new Set(cells.map((c) => c.round))];
  if (rounds.length === 0) return null;
  return (
    <div className="space-y-3">
      {rounds.map((round) => (
        <div key={round}>
          <h4 className="m-0 mb-1 text-xs tracking-widest text-text-secondary uppercase">{roundLabel(round)}</h4>
          <ul className="m-0 list-none space-y-1 p-0">
            {cells.filter((c) => c.round === round).sort((x, y) => x.slot - y.slot).map((c) => (
              <li key={c.key}><MatchRow a={c.a} b={c.b} score={c.score} busy={busy} onOpen={() => onOpen(c.id)} /></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
