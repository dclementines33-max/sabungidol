// Tier chip + rating (PRD §9). Colour comes from the tier token (PRD §10.1).
import { type Tier, tierOf } from "@sabung/shared";

const TIER_FILL: Record<Tier, string> = {
  S: "bg-accent-gold",
  A: "bg-accent-coral",
  B: "bg-accent-sage",
  C: "bg-accent-sky",
  D: "bg-neutral-taupe",
};

export function RatingBadge({ rating }: { rating: number }) {
  const tier = tierOf(rating);
  return (
    <span
      className={`${TIER_FILL[tier]} inline-flex items-center gap-1 rounded-control px-2 py-0.5 font-mono text-xs font-semibold text-on-fill tabular-nums`}
      aria-label={`Rating ${rating}, tier ${tier}`}
    >
      <span aria-hidden="true">{tier}</span>
      <span aria-hidden="true">{rating}</span>
    </span>
  );
}
