// A group table (LCQ, Unzure groups): photo, record, game difference, points; who goes through is named, not only coloured.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";

export type GroupRow = { idolId: string; rank: number; played: number; wins: number; draws: number; losses: number; points: number; gameDiff: number };

export function GroupTable({ name, rows, through }: { name: string; rows: GroupRow[]; through: number }) {
  const lookup = useIdolLookup();
  return (
    <table className="w-full border-collapse text-sm tabular-nums">
      <caption className="pb-2 text-left font-display text-lg">{name}</caption>
      <thead><tr className="text-left text-[10px] tracking-[0.18em] text-text-secondary uppercase">{["#", "Idol", "M", "Mn-S-K", "±", "Poin", ""].map((h, i) => <th key={i} scope="col" className="px-1 pb-1 font-bold">{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r) => {
          const idol = lookup(r.idolId);
          const lolos = r.played > 0 && r.rank <= through;
          return (
            <tr key={r.idolId} className={`border-t border-border/60 ${r.rank <= through ? "bg-cool/10" : ""}`}>
              <td className={`px-1 font-display ${r.rank <= through ? "text-cool" : "text-text-secondary"}`}>{r.rank}</td>
              <td className="px-1 py-1">
                <span className="flex items-center gap-2">
                  <IdolPhoto idolId={r.idolId} size={64} className="h-9 w-7 shrink-0" />
                  <span className="min-w-0"><span className="block max-w-40 truncate font-semibold">{idol?.name}</span><span className="block font-mono text-[10px] text-text-secondary">{idol?.groupName ?? "Solo"} · {idol?.rating}</span></span>
                </span>
              </td>
              <td className="px-1 font-mono">{r.played}</td>
              <td className="px-1 font-mono">{r.wins}-{r.draws}-{r.losses}</td>
              <td className="px-1 font-mono">{r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}</td>
              <td className="px-1 font-display text-base">{r.points}</td>
              <td className="px-1 text-xs font-bold text-cool uppercase">{lolos ? "lolos" : ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
