// Head to Head comparison (PRD §8): photos side by side, the direct W-D-L, then titles, win rate and best
// win streak of both careers.
import type { CareerRow } from "@sabung/engine";
import { IdolPhoto, useIdol } from "@sabung/ui";
import { IdolLink } from "../wiki/IdolLink";

type Pair = { meetings: number; wins: number; draws: number; losses: number } | null;

function Side({ id, align }: { id: string; align: "left" | "right" }) {
  const idol = useIdol(id);
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${align === "right" ? "items-end text-right" : ""}`}>
      <IdolPhoto idolId={id} size={256} className="w-28 sm:w-40" />
      <p className="m-0 text-xs tracking-widest text-text-secondary uppercase">{idol.groupName ?? "Soloist"}</p>
      <IdolLink id={id} className="font-display text-lg font-semibold uppercase sm:text-xl" />
    </div>
  );
}

export function H2HCompare({ a, b, pair, lineA, lineB }: { a: string; b: string; pair: Pair; lineA: CareerRow | null; lineB: CareerRow | null }) {
  const rows: [string, (l: CareerRow | null) => string][] = [
    ["Gelar", (l) => String(l?.titles ?? 0)],
    ["Win rate karier", (l) => `${Math.round((l?.winRate ?? 0) * 100)}%`],
    ["Streak menang terpanjang", (l) => String(l?.bestWinStreak ?? 0)],
    ["Match karier", (l) => String(l?.matches ?? 0)],
  ];
  return (
    <section aria-label="Perbandingan" className="space-y-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
        <Side id={a} align="left" />
        <div className="pb-2 text-center">
          <p className="m-0 font-mono text-3xl tabular-nums" aria-label={`Menang ${pair?.wins ?? 0}, seri ${pair?.draws ?? 0}, kalah ${pair?.losses ?? 0}`}>{pair?.wins ?? 0}–{pair?.draws ?? 0}–{pair?.losses ?? 0}</p>
          <p className="m-0 text-xs tracking-widest text-text-secondary uppercase">M-S-K · {pair?.meetings ?? 0} match</p>
        </div>
        <Side id={b} align="right" />
      </div>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Statistik karier</caption>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-border">
              <td className="w-1/3 py-2 font-mono tabular-nums">{value(lineA)}</td>
              <th scope="row" className="text-center font-normal text-text-secondary">{label}</th>
              <td className="w-1/3 text-right font-mono tabular-nums">{value(lineB)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
