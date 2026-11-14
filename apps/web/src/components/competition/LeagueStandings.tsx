// A league table (PRD §8): zones (named, not only coloured), form of the last 5 and a sparkline of
// the position after each matchday.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";

type Row = { idolId: string; rank: number; played: number; wins: number; draws: number; losses: number; points: number; gamesWon: number; gamesLost: number; gameDiff: number };
type Zone = { from: number; to: number; label: string; className: string };

export const ZONES: Record<string, Zone[]> = {
  D1: [
    { from: 1, to: 6, label: "Unzure Cup", className: "border-l-accent-bright" },
    { from: 7, to: 16, label: "Swiss Play-in", className: "border-l-cool" },
    { from: 18, to: 20, label: "Relegation", className: "border-l-danger" },
  ],
  D2: [{ from: 1, to: 3, label: "Promotion", className: "border-l-cool" }],
  IDL: [{ from: 1, to: 10, label: "Playoff", className: "border-l-cool" }],
};
const RESULT = { W: "bg-cool text-on-fill", D: "bg-muted text-on-fill", L: "bg-danger text-on-fill" };

function Sparkline({ ranks }: { ranks: number[] }) {
  if (ranks.length < 2) return null;
  const points = ranks.map((r, i) => `${(i / (ranks.length - 1)) * 60},${((r - 1) / 19) * 16}`).join(" ");
  return (
    <svg width="60" height="16" viewBox="-1 -1 62 18" role="img" aria-label={`Position from ${ranks[0]} to ${ranks.at(-1)}`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary" />
    </svg>
  );
}

export function LeagueStandings({ zoneKey, rows, form, positions }: { zoneKey: string; rows: Row[]; form: Record<string, ("W" | "D" | "L")[]>; positions: Record<string, number[]> }) {
  const lookup = useIdolLookup();
  const zones = ZONES[zoneKey] ?? [];
  const zoneOf = (rank: number) => zones.find((z) => rank >= z.from && rank <= z.to);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr className="text-left text-text-secondary">
            {["#", "Idol", "P", "W", "D", "L", "Games", "±", "Pts", "Form", "Trend", "Zone"].map((h) => <th key={h} scope="col" className="px-2 py-1 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const zone = zoneOf(r.rank);
            return (
              <tr key={r.idolId} className={`border-t border-border border-l-4 ${zone?.className ?? "border-l-transparent"}`}>
                <td className="px-2 py-1 font-mono">{r.rank}</td>
                <td className="px-2 py-1"><span className="flex items-center gap-2"><IdolPhoto idolId={r.idolId} size={64} className="w-7" />{lookup(r.idolId)?.name}</span></td>
                <td className="px-2 py-1 font-mono">{r.played}</td>
                <td className="px-2 py-1 font-mono">{r.wins}</td>
                <td className="px-2 py-1 font-mono">{r.draws}</td>
                <td className="px-2 py-1 font-mono">{r.losses}</td>
                <td className="px-2 py-1 font-mono">{r.gamesWon}–{r.gamesLost}</td>
                <td className="px-2 py-1 font-mono">{r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}</td>
                <td className="px-2 py-1 font-mono font-semibold">{r.points}</td>
                <td className="px-2 py-1">
                  <span className="flex gap-0.5" role="img" aria-label={`Form: ${(form[r.idolId] ?? []).join(" ") || "no games yet"}`}>
                    {(form[r.idolId] ?? []).map((f, i) => <span key={i} aria-hidden="true" className={`${RESULT[f]} inline-flex size-4 items-center justify-center rounded-sm text-[10px] font-semibold`}>{f}</span>)}
                  </span>
                </td>
                <td className="px-2 py-1"><Sparkline ranks={positions[r.idolId] ?? []} /></td>
                <td className="px-2 py-1 text-xs text-text-secondary">{zone?.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
