// Idol Profile → Rivals (PRD §8): the opponents met most often, with the record against each.
import { Link } from "@tanstack/react-router";
import { rivalryLabel } from "../h2h/rivalryLabel";
import { IdolLink } from "../wiki/IdolLink";

type Rival = { opponent: string; meetings: number; wins: number; draws: number; losses: number };

export function ProfileRivals({ idolId, rivals }: { idolId: string; rivals: Rival[] }) {
  if (!rivals.length) return <p className="text-sm text-text-secondary">No matches yet.</p>;
  return (
    <table className="w-full max-w-2xl border-collapse text-sm">
      <thead><tr className="text-left text-text-secondary"><th className="py-2 font-medium">Opponent</th><th className="font-medium">Match</th><th className="font-medium">W-D-L</th><th className="font-medium">Label</th><th><span className="sr-only">Head to Head</span></th></tr></thead>
      <tbody>
        {rivals.map((r) => (
          <tr key={r.opponent} className="border-t border-border">
            <td className="py-2"><IdolLink id={r.opponent} /></td>
            <td className="font-mono tabular-nums">{r.meetings}</td>
            <td className="font-mono tabular-nums">{r.wins}-{r.draws}-{r.losses}</td>
            <td className="text-xs font-bold text-accent-bright uppercase">{rivalryLabel(r.wins, r.draws, r.losses)}</td>
            <td><Link to="/wiki/h2h" search={{ a: idolId, b: r.opponent }} className="text-accent-bright underline underline-offset-4">H2H</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
