// Idol card as a premium trading card (redesign 2026-11-17, user via router: Pokémon full-art, MTG borderless, EA FC,
// Topps Chrome): the photo fills the card, the tier picks the frame (.tcg-card in tokens.css — S+ prismatic foil, S gold
// foil with a holo sheen, plainer metal down to F), a FUT-style column top-left (rating, solid tier badge, flag image), the
// group logo top-right, and a dark name plate: group, NAME, age and titles. Rating and tier in the bold display font.
import { tierOf } from "@sabung/shared";
import { Trophy } from "lucide-react";
import { Flag } from "./Flag";
import { IdolPhoto } from "./IdolPhoto";
import { TIER_FILL } from "./RatingBadge";
import { useGalleryPhoto, useIdol } from "./idolSource";

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

const SHADOW = "[text-shadow:0_2px_10px_rgb(0_0_0/0.9)]";

export function IdolCard({ idolId }: { idolId: string }) {
  const idol = useIdol(idolId);
  const tier = tierOf(idol.rating);
  const age = toAge(idol.birthday);
  const logoUrl = useGalleryPhoto(idol.groupLogoId ?? "", 64) || null;
  return (
    <article data-tier={tier} className="tcg-card w-48">
      <div className="tcg-art">
        <IdolPhoto idolId={idolId} size={256} className="absolute inset-0 size-full aspect-auto! rounded-none!" />
        {/* Scrims: a dark corner under the rating column and a dark plate under the name, so text reads on any photo. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(7rem_7rem_at_0%_0%,rgb(1_0_3/0.7),transparent_70%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-bg-base from-30% via-bg-base/60 to-transparent" />

        <div className="absolute top-1.5 left-1.5 flex flex-col items-center gap-1">
          <span role="img" aria-label={`Rating ${idol.rating}, tier ${tier}`} className={`font-display text-xl leading-none font-black tracking-tight text-text-primary tabular-nums [font-stretch:110%] ${SHADOW}`}>
            {idol.rating}
          </span>
          <span aria-hidden="true" className={`${TIER_FILL[tier]} min-w-8 rounded-[3px] px-1 py-0.5 text-center font-display text-sm leading-none font-black [font-stretch:120%] shadow-[0_2px_6px_rgb(0_0_0/0.6)]`}>{tier}</span>
          {idol.nationality && <Flag code={idol.nationality} className="h-3.5" />}
        </div>
        {logoUrl && <img src={logoUrl} alt="" aria-hidden="true" className="absolute top-1.5 right-1.5 size-7 object-contain drop-shadow-[0_1px_4px_rgb(0_0_0/0.9)]" />}

        <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2">
          <div className="mx-auto mb-1 h-px w-2/3" style={{ background: "linear-gradient(90deg, transparent, var(--tier), transparent)" }} />
          <p className="m-0 truncate text-center text-[9px] font-bold tracking-[0.22em] text-text-secondary uppercase [font-stretch:120%]">{idol.groupName ?? "Soloist"}</p>
          <p className={`m-0 line-clamp-2 text-center font-display text-base leading-none font-black break-words uppercase ${SHADOW}`}>{idol.name}</p>
          <div className="mt-0.5 flex min-h-4 items-center justify-center gap-3 text-[11px] text-text-secondary">
            {age !== null && <span className="tabular-nums">{age} yrs</span>}
            {!!idol.titles && (
              <span role="img" className="inline-flex items-center gap-1 text-accent-bright" aria-label={`${idol.titles} titles`}>
                <Trophy aria-hidden="true" size={12} strokeWidth={1.75} />
                <span aria-hidden="true" className="font-mono tabular-nums">{idol.titles}</span>
              </span>
            )}
            {idol.active === false && <span className="tag">Inactive</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
