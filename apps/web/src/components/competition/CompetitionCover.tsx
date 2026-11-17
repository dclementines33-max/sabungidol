// A competition panel's "magazine cover" (redesign brief, design/refs editorial + swiss punk): the competition's
// own colour as a glow, its logo, a tag and an issue line, the name huge with the same word again as a giant
// outline behind, a few big numbers (no boxes) and, when there is one, the leading idol's photo torn at the bottom.
import { IdolPhoto, useIdol } from "@sabung/ui";
import type { ReactNode } from "react";
import { CompetitionLogo } from "../CompetitionLogo";

export type CoverStat = { label: string; value: ReactNode };

function HeroName({ id, role }: { id: string; role: string }) {
  return <p className="m-0 mt-1 text-sm"><span className="kicker">{role}</span> <span className="font-display text-base">{useIdol(id).name}</span></p>;
}

export function CompetitionCover({ name, code, issue, color, logoId, stats = [], hero, heroRole = "Leader" }: {
  name: string;
  code: string;
  issue: string; // e.g. "Season 3 · MD 24/38"
  color?: string; // branding token, e.g. "brand-rose"
  logoId?: string | null;
  stats?: CoverStat[];
  hero?: string | null; // idol id
  heroRole?: string;
}) {
  const tint = `var(--color-${color ?? "accent"})`;
  return (
    <header className="relative isolate overflow-hidden rounded-card px-5 pt-5 pb-6 sm:px-8 sm:pt-8"
      style={{ boxShadow: `inset 0 3px 0 ${tint}, 0 30px 60px -30px black`, background: `linear-gradient(105deg, transparent 52%, color-mix(in oklab, ${tint} 16%, transparent) 52% 60%, transparent 60% 63%, color-mix(in oklab, ${tint} 10%, transparent) 63% 66%, transparent 66%), repeating-linear-gradient(-55deg, rgb(255 255 255 / 0.025) 0 2px, transparent 2px 10px), radial-gradient(60rem 26rem at 85% 100%, color-mix(in oklab, ${tint} 42%, transparent), transparent 70%), radial-gradient(30rem 14rem at 20% -10%, rgb(255 255 255 / 0.06), transparent 70%), linear-gradient(115deg, color-mix(in oklab, ${tint} 24%, var(--color-bg-base)), var(--color-bg-base) 75%)` }}>
      <p aria-hidden="true" className="outline-text pointer-events-none absolute -bottom-3 left-2 -z-10 m-0 font-display text-ornament leading-none whitespace-nowrap opacity-60">{name}</p>
      {hero && <IdolPhoto idolId={hero} size={1024} className="photo-frame absolute right-6 bottom-0 -z-10 hidden w-44 rotate-2 shadow-[0_0_60px_-10px_var(--color-accent-bright)] sm:block lg:w-64" />}
      <div className="flex flex-wrap items-center gap-3">
        <CompetitionLogo logoId={logoId} className="size-12" />
        <span className="tag">{code}</span>
        <span className="kicker">{issue}</span>
      </div>
      <h2 className="m-0 mt-4 max-w-[16ch] text-hero [text-shadow:0_6px_40px_rgb(0_0_0/0.8)]">{name}</h2>
      {hero && <HeroName id={hero} role={heroRole} />}
      {stats.length > 0 && (
        <dl className="m-0 mt-6 flex flex-wrap gap-x-10 gap-y-3">
          {stats.map((s) => (
            <div key={s.label} className="border-l-4 pl-3" style={{ borderColor: tint }}>
              <dt className="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{s.label}</dt>
              <dd className="score m-0 mt-1 text-3xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
