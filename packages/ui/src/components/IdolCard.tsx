// Idol card as a trading card (design/refs/idol card design 1–2; user decisions 2026-11-13):
// the photo fills the top in a frame of the group colour, a line in the tier colour carries the
// rating in a circle, and the name plate shows group, NAME and titles. Form is not shown here.
import { tierOf } from "@sabung/shared";
import { Trophy } from "lucide-react";
import { IdolPhoto } from "./IdolPhoto";
import { TIER_FILL } from "./RatingBadge";
import { useIdol } from "./idolSource";

export function IdolCard({ idolId }: { idolId: string }) {
  const idol = useIdol(idolId);
  const tier = tierOf(idol.rating);
  return (
    <article
      className="w-48 overflow-hidden rounded-card border-2 bg-bg-raised"
      style={{ borderColor: `var(--color-${idol.groupColor ?? "border-strong"})` }}
    >
      <IdolPhoto idolId={idolId} size={256} className="w-full rounded-none!" />
      <div className={`h-1 ${TIER_FILL[tier]}`} aria-hidden="true" />
      <div className="relative px-3 pt-6 pb-3">
        <span
          role="img"
          aria-label={`Rating ${idol.rating}, tier ${tier}`}
          className={`${TIER_FILL[tier]} absolute -top-5 left-3 flex size-10 items-center justify-center rounded-full border-2 border-bg-raised font-mono text-base font-semibold tabular-nums`}
        >
          <span aria-hidden="true">{idol.rating}</span>
        </span>
        <p className="m-0 truncate text-xs tracking-widest text-text-secondary uppercase">{idol.groupName ?? "Soloist"}</p>
        <p className="m-0 truncate font-display text-lg font-semibold uppercase">{idol.name}</p>
        <div className="mt-1 flex min-h-5 flex-wrap items-center gap-2">
          {!!idol.titles && (
            <span role="img" className="inline-flex items-center gap-1 text-xs text-accent-bright" aria-label={`${idol.titles} titles`}>
              <Trophy aria-hidden="true" size={14} strokeWidth={1.5} />
              <span aria-hidden="true" className="font-mono tabular-nums">{idol.titles}</span>
            </span>
          )}
          {idol.active === false && <span className="rounded-control border border-border-strong px-2 py-0.5 text-xs text-text-secondary">Nonaktif</span>}
        </div>
      </div>
    </article>
  );
}
