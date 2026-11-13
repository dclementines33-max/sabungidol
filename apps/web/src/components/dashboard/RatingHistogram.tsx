// Rating distribution (PRD §8 Dashboard): active idols per 5-point band, bars in the band's tier colour.
import { tierOf } from "@sabung/shared";
import { TIER_FILL } from "@sabung/ui";

export function RatingHistogram({ ratings }: { ratings: number[] }) {
  const bands = Array.from({ length: 12 }, (_, i) => 40 + i * 5).map((from) => ({ from, n: ratings.filter((r) => r >= from && r < from + 5 || (from === 95 && r === 100)).length }));
  const max = Math.max(1, ...bands.map((b) => b.n));
  return (
    <ul className="m-0 flex h-32 list-none gap-1 p-0" aria-label="Distribusi rating">
      {bands.map((b) => (
        <li key={b.from} className="flex flex-1 flex-col items-center justify-end gap-1" aria-label={`${b.from}–${b.from + 4}: ${b.n} idol`}>
          <span aria-hidden="true" className={`w-full min-h-px rounded-t-sm ${TIER_FILL[tierOf(b.from)]}`} style={{ height: `${(b.n / max) * 100}%` }} />
          <span aria-hidden="true" className="font-mono text-[10px] text-text-secondary">{b.from}</span>
        </li>
      ))}
    </ul>
  );
}
