// A group's members split by rating tier: one stacked bar in the tier colours, with the counts as text under it.
import { TIERS } from "@sabung/shared";
import { TIER_FILL } from "@sabung/ui";

export function TierMix({ tiers, name }: { tiers: Record<string, number>; name: string }) {
  const shown = TIERS.filter((t) => tiers[t.tier]);
  return (
    <div role="img" aria-label={`${name} tier mix: ${shown.map((t) => `${tiers[t.tier]} ${t.tier}`).join(", ")}`} className="mt-3 max-w-md">
      <div className="flex h-2 overflow-hidden">
        {shown.map((t) => <span key={t.tier} className={TIER_FILL[t.tier]} style={{ flexGrow: tiers[t.tier] }} />)}
      </div>
      <p aria-hidden="true" className="m-0 mt-1 flex flex-wrap gap-x-3 font-mono text-xs text-text-secondary">
        {shown.map((t) => <span key={t.tier}>{t.tier} <b className="text-text-primary">{tiers[t.tier]}</b></span>)}
      </p>
    </div>
  );
}
