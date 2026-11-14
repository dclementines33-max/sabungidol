// Idol card as a trading card (design/refs/idol card design 1–2; redesign brief 2026-11-13): no frame —
// the photo sits in a crimson-to-gold frame (Update 3), the rating is a big blackletter number in the corner with
// a tier-coloured bar, the group colour glows under the card, and the name plate shows group, NAME, titles.
import { tierOf } from "@sabung/shared";
import { Trophy } from "lucide-react";
import { IdolPhoto } from "./IdolPhoto";
import { TIER_FILL } from "./RatingBadge";
import { useIdol } from "./idolSource";

export function IdolCard({ idolId }: { idolId: string }) {
  const idol = useIdol(idolId);
  const tier = tierOf(idol.rating);
  const glow = `var(--color-${idol.groupColor ?? "accent"})`;
  return (
    <article className="relative w-48 overflow-hidden rounded-card bg-bg-raised shadow-[0_14px_24px_-18px_var(--glow)] transition-transform duration-(--duration-base) hover:-translate-y-1"
      style={{ "--glow": glow } as React.CSSProperties}>
      <div className="relative">
        <IdolPhoto idolId={idolId} size={256} className="photo-frame w-full rounded-none! contrast-110 saturate-90" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bg-raised/90 via-transparent to-bg-base/40" />
        <span aria-hidden="true" className="absolute top-3 left-0 h-14 w-1" style={{ background: glow }} />
        <span role="img" aria-label={`Rating ${idol.rating}, tier ${tier}`} className="absolute top-1 right-2 flex flex-col items-end">
          <span aria-hidden="true" className="font-gothic text-2xl leading-none text-text-primary drop-shadow-[0_2px_8px_rgb(0_0_0/0.95)]">{idol.rating}</span>
          <span aria-hidden="true" className={`${TIER_FILL[tier]} mt-0.5 px-1.5 text-[10px] font-extrabold tracking-widest`}>{tier}</span>
        </span>
      </div>
      <div className="px-3 pt-1 pb-3">
        <p className="m-0 truncate text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase [font-stretch:120%]">{idol.groupName ?? "Soloist"}</p>
        <p className="m-0 truncate font-display text-lg">{idol.name}</p>
        <div className="mt-1 flex min-h-5 flex-wrap items-center gap-2">
          {!!idol.titles && (
            <span role="img" className="inline-flex items-center gap-1 text-xs text-accent-bright" aria-label={`${idol.titles} titles`}>
              <Trophy aria-hidden="true" size={14} strokeWidth={1.5} />
              <span aria-hidden="true" className="font-mono tabular-nums">{idol.titles}</span>
            </span>
          )}
          {idol.active === false && <span className="tag">Inactive</span>}
        </div>
      </div>
    </article>
  );
}
