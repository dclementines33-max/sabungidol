// A group table (LCQ, Unzure groups): photo, record, game difference, points; who goes through is named, not only coloured.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";

export type GroupRow = { idolId: string; rank: number; played: number; wins: number; draws: number; losses: number; points: number; gameDiff: number };

export function GroupTable({ name, rows, through }: { name: string; rows: GroupRow[]; through: number }) {
  const lookup = useIdolLookup();
  return (
    <table className="board text-sm">
      <caption className="section-title pb-3 text-left text-lg">{name}</caption>
      <thead><tr>{["#", "Idol", "P", "W-D-L", "±", "Pts", ""].map((h, i) => <th key={i} scope="col" className="px-1 pb-1 font-bold">{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => {
          const idol = lookup(r.idolId);
          const lolos = r.played > 0 && r.rank <= through;
          return (
            <tr key={r.idolId}>
              <td className={`rank w-10 ${r.rank <= through ? "text-cool" : "text-text-secondary"}`} style={r.rank <= through ? { boxShadow: "inset 4px 0 0 var(--color-cool)" } : undefined}>{r.rank}</td>
              <td>
                <span className="flex items-center gap-2">
                  <IdolPhoto idolId={r.idolId} size={64} className="h-9 w-7 shrink-0 rounded-[3px]" />
                  <span className="min-w-0"><span className="block max-w-40 truncate font-semibold">{idol?.name}</span><span className="block font-mono text-[10px] text-text-secondary">{idol?.groupName ?? "Solo"} · {idol?.rating}</span></span>
                </span>
              </td>
              <td className="font-mono">{r.played}</td>
              <td className="font-mono">{r.wins}-{r.draws}-{r.losses}</td>
              <td className="font-mono">{r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}</td>
              <td className="pts">{r.points}</td>
              <td className="text-xs font-bold tracking-[0.12em] text-cool uppercase">{lolos ? "through" : ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
