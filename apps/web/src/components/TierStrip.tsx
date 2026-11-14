// How many idols sit in each rating tier (Update 3 ref "tier strip"): one cell per tier with its colour, range and count.
import { TIERS, tierOf } from "@sabung/shared";
import { TIER_FILL } from "@sabung/ui";

export function TierStrip({ ratings }: { ratings: number[] }) {
  const count = (t: string) => ratings.filter((r) => tierOf(r) === t).length;
  return (
    <ul aria-label="Tier spread" className="m-0 grid list-none grid-cols-4 gap-2 p-0 sm:grid-cols-7">
      {TIERS.map(({ tier, range }) => (
        <li key={tier} className="bg-surface/70 px-3 py-2">
          <p className="m-0 flex items-center gap-2 text-xs">
            <span className={`${TIER_FILL[tier]} px-1.5 font-extrabold`}>{tier}</span>
            <span className="font-mono text-text-secondary">{range}</span>
          </p>
          <p className="m-0 mt-1"><span className="font-display text-2xl tabular-nums">{count(tier)}</span> <span className="text-xs text-text-secondary">idols</span></p>
        </li>
      ))}
    </ul>
  );
}
