// A league table (PRD §8): zones (named, not only coloured), form of the last 5 and a sparkline of
// the position after each matchday. Design round 2 (Fight Night): a standings board (.board) — the rank as a scoreboard
// numeral, the zone as a slanted colour bar, the leader's row in gold, the points column lit.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";

type Row = { idolId: string; rank: number; played: number; wins: number; draws: number; losses: number; points: number; gamesWon: number; gamesLost: number; gameDiff: number };
type Zone = { from: number; to: number; label: string; tone: string };

export const ZONES: Record<string, Zone[]> = {
  D1: [
    { from: 1, to: 6, label: "Unzure Cup", tone: "accent-bright" },
    { from: 7, to: 16, label: "Swiss Play-in", tone: "cool" },
    { from: 18, to: 20, label: "Relegation", tone: "danger" },
  ],
  D2: [{ from: 1, to: 3, label: "Promotion", tone: "cool" }],
  IDL: [{ from: 1, to: 10, label: "Playoff", tone: "cool" }],
};
const RESULT = { W: "bg-cool text-on-fill", D: "bg-muted text-on-fill", L: "bg-danger text-on-fill" };

function Sparkline({ ranks }: { ranks: number[] }) {
  if (ranks.length < 2) return null;
  const points = ranks.map((r, i) => `${(i / (ranks.length - 1)) * 60},${((r - 1) / 19) * 16}`).join(" ");
  return (
    <svg width="60" height="16" viewBox="-1 -1 62 18" role="img" aria-label={`Position from ${ranks[0]} to ${ranks.at(-1)}`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-bright" />
    </svg>
  );
}

export function LeagueStandings({ zoneKey, rows, form, positions }: { zoneKey: string; rows: Row[]; form: Record<string, ("W" | "D" | "L")[]>; positions: Record<string, number[]> }) {
  const lookup = useIdolLookup();
  const zones = ZONES[zoneKey] ?? [];
  const zoneOf = (rank: number) => zones.find((z) => rank >= z.from && rank <= z.to);
  return (
    <div className="overflow-x-auto">
      <table className="board text-sm">
        <thead>
          <tr>
            {["#", "Idol", "P", "W", "D", "L", "Games", "±", "Pts", "Form", "Trend", "Zone"].map((h) => <th key={h} scope="col" className={h === "Pts" || h === "#" ? "text-center" : ""}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const zone = zoneOf(r.rank);
            return (
              <tr key={r.idolId} className={r.rank === 1 && r.played ? "is-top" : ""}>
                <td className="rank relative w-12" style={zone ? { boxShadow: `inset 4px 0 0 var(--color-${zone.tone})` } : undefined}>{r.rank}</td>
                <td><span className="flex items-center gap-2.5"><IdolPhoto idolId={r.idolId} size={64} className="h-9 w-7 shrink-0 rounded-[3px]" /><span className="font-display uppercase">{lookup(r.idolId)?.name}</span></span></td>
                <td className="font-mono">{r.played}</td>
                <td className="font-mono">{r.wins}</td>
                <td className="font-mono">{r.draws}</td>
                <td className="font-mono">{r.losses}</td>
                <td className="font-mono">{r.gamesWon}–{r.gamesLost}</td>
                <td className={`font-mono ${r.gameDiff > 0 ? "text-cool" : r.gameDiff < 0 ? "text-accent-bright" : ""}`}>{r.gameDiff > 0 ? `+${r.gameDiff}` : r.gameDiff}</td>
                <td className="pts">{r.points}</td>
                <td>
                  <span className="flex gap-1" role="img" aria-label={`Form: ${(form[r.idolId] ?? []).join(" ") || "no games yet"}`}>
                    {(form[r.idolId] ?? []).map((f, i) => <span key={i} aria-hidden="true" className={`${RESULT[f]} inline-flex h-4 w-4 -skew-x-12 items-center justify-center text-[10px] font-bold`}>{f}</span>)}
                  </span>
                </td>
                <td><Sparkline ranks={positions[r.idolId] ?? []} /></td>
                <td className="text-xs font-bold tracking-[0.12em] uppercase" style={zone ? { color: `var(--color-${zone.tone})` } : undefined}>{zone?.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
