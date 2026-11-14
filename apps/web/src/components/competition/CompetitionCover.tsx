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

export function CompetitionCover({ name, code, issue, color, logoId, stats = [], hero, heroRole = "Pemimpin" }: {
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
    <header className="relative isolate mx-auto max-w-3xl overflow-hidden rounded-card px-4 pt-4 pb-5 sm:px-6 sm:pt-5"
      style={{ background: `radial-gradient(60rem 26rem at 85% 100%, color-mix(in oklab, ${tint} 38%, transparent), transparent 70%), linear-gradient(115deg, color-mix(in oklab, ${tint} 22%, var(--color-bg-base)), var(--color-bg-base) 75%)` }}>
      <p aria-hidden="true" className="outline-text pointer-events-none absolute -bottom-3 left-2 -z-10 m-0 font-display text-[clamp(3rem,9vw,6rem)] leading-none whitespace-nowrap opacity-40">{name}</p>
      {hero && <IdolPhoto idolId={hero} size={1024} className="photo-frame absolute right-4 bottom-0 -z-10 hidden w-28 opacity-90 sm:block lg:w-36" />}
      <div className="flex flex-wrap items-center gap-3">
        <CompetitionLogo logoId={logoId} className="size-9" />
        <span className="tag">{code}</span>
        <span className="kicker">{issue}</span>
      </div>
      <h2 className="m-0 mt-3 max-w-[16ch] text-[clamp(1.75rem,4vw,2.75rem)]">{name}</h2>
      {hero && <HeroName id={hero} role={heroRole} />}
      {stats.length > 0 && (
        <dl className="m-0 mt-4 grid max-w-md grid-cols-2 gap-x-6 gap-y-3">
          {stats.map((s) => (
            <div key={s.label} className="border-l-2 pl-3" style={{ borderColor: tint }}>
              <dt className="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{s.label}</dt>
              <dd className="m-0 font-display text-xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
