// A small group table (LCQ, Unzure groups): who goes through is named, not only coloured.
import { useIdolLookup } from "@sabung/ui";

type Row = { idolId: string; rank: number; played: number; wins: number; draws: number; losses: number; points: number; gameDiff: number };

export function GroupTable({ name, rows, through }: { name: string; rows: Row[]; through: number }) {
  const lookup = useIdolLookup();
  return (
    <table className="w-full border-collapse text-sm tabular-nums">
      <caption className="pb-1 text-left font-medium">{name}</caption>
      <thead><tr className="text-left text-text-secondary">{["#", "Idol", "M", "Mn-S-K", "±", "Poin", ""].map((h, i) => <th key={i} scope="col" className="px-1 font-medium">{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.idolId} className="border-t border-border">
            <td className="px-1 font-mono">{r.rank}</td>
            <td className="max-w-40 truncate px-1">{lookup(r.idolId)?.name}</td>
            <td className="px-1 font-mono">{r.played}</td>
            <td className="px-1 font-mono">{r.wins}-{r.draws}-{r.losses}</td>
            <td className="px-1 font-mono">{r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}</td>
            <td className="px-1 font-mono font-semibold">{r.points}</td>
            <td className="px-1 text-xs text-cool">{r.played > 0 && r.rank <= through ? "lolos" : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
