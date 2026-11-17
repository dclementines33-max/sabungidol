// One idol's season in numbers (W-D-L, win rate, titles, games, best run, rating): the stat row of Season Honours, also
// under every award winner. No places, no news.
import { useIdol } from "@sabung/ui";
import type { HonoursDetail } from "./HonoursIdol";

export function SeasonStatLine({ d, small = false, wide = false }: { d: HonoursDetail; small?: boolean; wide?: boolean }) {
  const idol = useIdol(d.id);
  const r = d.record;
  const stats: [string, string][] = [
    ["W-D-L", `${r.wins}-${r.draws}-${r.losses}`],
    ["Win rate", `${(r.winRate * 100).toFixed(1)}%`],
    ["Titles", String(d.titles.length)],
    ["Games", `${r.gamesWon}–${r.gamesLost}`],
    ["Best run", `${r.bestStreak}W`],
    ["Rating", d.rating ? `${d.rating.old} → ${d.rating.new}` : String(d.startRating ?? idol.rating)],
  ];
  return (
    <dl className={`m-0 grid w-full grid-cols-3 border-y border-border ${small ? "gap-x-3 gap-y-1 py-2" : wide ? "gap-x-4 gap-y-3 py-3 sm:grid-cols-6" : "max-w-md gap-x-4 gap-y-3 py-3"}`}>
      {stats.map(([k, v]) => (
        <div key={k}><dt className="text-xs tracking-widest text-text-secondary uppercase">{k}</dt><dd className={`score m-0 whitespace-nowrap ${small ? "text-sm" : "text-base sm:text-lg"}`}>{v}</dd></div>
      ))}
    </dl>
  );
}
