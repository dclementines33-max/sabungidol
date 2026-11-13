// How many idols sit in each rating tier (Update 3 ref "tier strip"): one cell per tier with its colour, range and count.
import { type Tier, tierOf } from "@sabung/shared";
import { TIER_FILL } from "@sabung/ui";

const TIERS: [Tier, string][] = [["S", "90–100"], ["A", "80–89"], ["B", "70–79"], ["C", "60–69"], ["D", "0–59"]];

export function TierStrip({ ratings }: { ratings: number[] }) {
  const count = (t: Tier) => ratings.filter((r) => tierOf(r) === t).length;
  return (
    <ul aria-label="Sebaran tier" className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-5">
      {TIERS.map(([t, range]) => (
        <li key={t} className="bg-surface/70 px-3 py-2">
          <p className="m-0 flex items-center gap-2 text-xs">
            <span className={`${TIER_FILL[t]} px-1.5 font-extrabold`}>{t}</span>
            <span className="font-mono text-text-secondary">{range}</span>
          </p>
          <p className="m-0 mt-1"><span className="font-display text-2xl tabular-nums">{count(t)}</span> <span className="text-xs text-text-secondary">idol</span></p>
        </li>
      ))}
    </ul>
  );
}
