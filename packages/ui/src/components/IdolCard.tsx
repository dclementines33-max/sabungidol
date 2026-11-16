// Idol card as a trading card (design/refs/idol card design 1–2; redesign brief 2026-11-13): no frame —
// the photo sits in a crimson-to-gold frame (Update 3), the rating is a big blackletter number in the corner
// with a tier-coloured bar, the group colour glows under the card, and the name plate shows group, NAME, titles.
// Redesigned 2026-11-17: much bigger tier badge spanning the photo bottom, flag emoji, age.
import { tierOf } from "@sabung/shared";
import { Trophy } from "lucide-react";
import { IdolPhoto } from "./IdolPhoto";
import { TIER_FILL } from "./RatingBadge";
import { useIdol } from "./idolSource";

// ISO 3166-1 alpha-2 → flag emoji (regional indicator symbols A–Z = U+1F1E6–U+1F1FF).
const toFlag = (code: string | null | undefined): string | null =>
  code?.length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))) : null;

// Birthday ISO string → age in years.
const toAge = (birthday: string | null | undefined): number | null => {
  if (!birthday) return null;
  const born = new Date(birthday);
  if (isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--;
  return age > 0 && age < 60 ? age : null;
};

export function IdolCard({ idolId }: { idolId: string }) {
  const idol = useIdol(idolId);
  const tier = tierOf(idol.rating);
  const glow = `var(--color-${idol.groupColor ?? "accent"})`;
  const flag = toFlag(idol.nationality);
  const age = toAge(idol.birthday);
  return (
    <article className="relative w-48 overflow-hidden rounded-card bg-bg-raised shadow-[0_14px_24px_-18px_var(--glow)] transition-transform duration-(--duration-base) hover:-translate-y-1"
      style={{ "--glow": glow } as React.CSSProperties}>
      {/* Photo */}
      <div className="relative">
        <IdolPhoto idolId={idolId} size={256} className="photo-frame w-full rounded-none! contrast-110 saturate-90" />
        {/* Fade from bottom */}
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bg-raised/80 via-transparent to-bg-base/30" />
        {/* Rating + tier — top-right, combined accessible label */}
        <span role="img" aria-label={`Rating ${idol.rating}, tier ${tier}`} className="absolute top-2 right-2 font-gothic text-2xl leading-none text-text-primary drop-shadow-[0_2px_8px_rgb(0_0_0/0.9)]">
          {idol.rating}
        </span>
        {/* Flag — top-left */}
        {flag && <span aria-hidden="true" className="absolute top-2 left-2 text-xl leading-none drop-shadow-[0_1px_4px_rgb(0_0_0/0.8)]">{flag}</span>}
        {/* BIG tier badge — full-width bar at photo bottom */}
        <div aria-hidden="true" className={`absolute bottom-0 inset-x-0 ${TIER_FILL[tier]} flex items-center justify-center py-1.5`}>
          <span className="font-gothic text-3xl leading-none tracking-wider">{tier}</span>
        </div>
      </div>
      {/* Footer */}
      <div className="px-3 pt-1.5 pb-3">
        <div className="flex items-baseline justify-between gap-1">
          <p className="m-0 truncate text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase [font-stretch:120%]">{idol.groupName ?? "Soloist"}</p>
          {age !== null && <span className="shrink-0 text-[10px] text-text-secondary tabular-nums">{age}y</span>}
        </div>
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
