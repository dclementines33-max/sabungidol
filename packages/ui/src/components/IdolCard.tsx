// Idol card as a premium trading card (redesign 2026-11-17, user via router: Pokémon full-art, MTG borderless, EA FC,
// Topps Chrome): the photo fills the card, the tier picks the frame (.tcg-card in tokens.css — S+ prismatic foil, S gold
// foil with a holo sheen, plainer metal down to F), a FUT-style column top-left (big rating, solid tier badge, flag), the
// group logo top-right, and a dark name plate: group, NAME, age and titles. Rating and tier in the bold display font.
import { tierOf } from "@sabung/shared";
import { Trophy } from "lucide-react";
import { IdolPhoto } from "./IdolPhoto";
import { TIER_FILL } from "./RatingBadge";
import { useGalleryPhoto, useIdol } from "./idolSource";

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

const SHADOW = "[text-shadow:0_2px_10px_rgb(0_0_0/0.9)]";

export function IdolCard({ idolId }: { idolId: string }) {
  const idol = useIdol(idolId);
  const tier = tierOf(idol.rating);
  const flag = toFlag(idol.nationality);
  const age = toAge(idol.birthday);
  const logoUrl = useGalleryPhoto(idol.groupLogoId ?? "", 64) || null;
  return (
    <article data-tier={tier} className="tcg-card w-48">
      <div className="tcg-art">
        <IdolPhoto idolId={idolId} size={256} className="absolute inset-0 size-full aspect-auto! rounded-none!" />
        {/* Scrims: a dark corner under the rating column and a dark plate under the name, so text reads on any photo. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(9rem_8rem_at_0%_0%,rgb(1_0_3/0.75),transparent_70%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-bg-base from-35% via-bg-base/70 to-transparent" />

        <div className="absolute top-2 left-2 flex flex-col items-center gap-1">
          <span role="img" aria-label={`Rating ${idol.rating}, tier ${tier}`} className={`font-display text-2xl leading-none font-black tracking-tight text-text-primary tabular-nums [font-stretch:110%] ${SHADOW}`}>
            {idol.rating}
          </span>
          <span aria-hidden="true" className={`${TIER_FILL[tier]} min-w-10 rounded-[3px] px-1.5 py-0.5 text-center font-display text-lg leading-none font-black [font-stretch:120%] shadow-[0_2px_6px_rgb(0_0_0/0.6)]`}>{tier}</span>
          {flag && <span aria-hidden="true" className="text-lg leading-none drop-shadow-[0_1px_3px_rgb(0_0_0/0.8)]">{flag}</span>}
        </div>
        {logoUrl && <img src={logoUrl} alt="" aria-hidden="true" className="absolute top-2 right-2 size-8 object-contain drop-shadow-[0_1px_4px_rgb(0_0_0/0.9)]" />}

        <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
          <div className="mx-auto mb-1.5 h-px w-2/3" style={{ background: "linear-gradient(90deg, transparent, var(--tier), transparent)" }} />
          <p className="m-0 truncate text-center text-[10px] font-bold tracking-[0.25em] text-text-secondary uppercase [font-stretch:120%]">{idol.groupName ?? "Soloist"}</p>
          <p className={`m-0 line-clamp-2 text-center font-display text-lg leading-none font-black break-words uppercase ${SHADOW}`}>{idol.name}</p>
          <div className="mt-1 flex min-h-5 items-center justify-center gap-3 text-xs text-text-secondary">
            {age !== null && <span className="tabular-nums">{age} yrs</span>}
            {!!idol.titles && (
              <span role="img" className="inline-flex items-center gap-1 text-accent-bright" aria-label={`${idol.titles} titles`}>
                <Trophy aria-hidden="true" size={13} strokeWidth={1.75} />
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
