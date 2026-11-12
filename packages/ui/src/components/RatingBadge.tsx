// Tier chip + rating (PRD §9). Colour comes from the tier token (PRD §10.1).
import { type Tier, tierOf } from "@sabung/shared";

// Fill + text per tier; exported for the idol card's rating circle.
export const TIER_FILL: Record<Tier, string> = {
  S: "bg-tier-s text-on-fill",
  A: "bg-tier-a text-on-fill",
  B: "bg-tier-b text-on-fill",
  C: "bg-tier-c text-on-fill",
  D: "bg-tier-d text-text-primary", // navy: light text
};

export function RatingBadge({ rating }: { rating: number }) {
  const tier = tierOf(rating);
  return (
    <span
      className={`${TIER_FILL[tier]} inline-flex items-center gap-1 rounded-control px-2 py-0.5 font-mono text-xs font-semibold tabular-nums`}
      role="img" // a span may not carry a label; as an image the label is read out
      aria-label={`Rating ${rating}, tier ${tier}`}
    >
      <span aria-hidden="true">{tier}</span>
      <span aria-hidden="true">{rating}</span>
    </span>
  );
}
