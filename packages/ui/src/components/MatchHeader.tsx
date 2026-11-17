// Top of the match screen (PRD §9; Update 3): a stage in the competition's own colour — big tilted photos,
// a giant faded competition word behind them, a blackletter VS, name, group, rating, form, chance to win
// (engine, before variance) and a short head-to-head. A grand final gets gold, a trophy and more light.
import { getForm, seriesOdds } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { Trophy } from "../icons";
import { FormBadge } from "./FormBadge";
import { IdolPhoto } from "./IdolPhoto";
import { RatingBadge } from "./RatingBadge";
import { useIdol } from "./idolSource";

export type HeadToHead = { winsA: number; draws: number; winsB: number };
export type MatchTheme = { accent?: string; kicker?: string; grandFinal?: boolean }; // accent = a colour token name, e.g. "brand-violet"
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Side({ idolId, align, glow, corner }: { idolId: string; align: "left" | "right"; glow: string; corner: string }) {
  const idol = useIdol(idolId);
  return (
    <div className={`relative z-[1] flex min-w-0 flex-col gap-1 ${align === "right" ? "items-end text-right" : "items-start"}`}>
      <p className="kicker m-0 mb-1" style={{ color: glow }}>{corner}</p>
      <div className={`${align === "left" ? "-rotate-2" : "rotate-2"} shadow-[0_24px_50px_-18px_var(--glow)]`} style={{ "--glow": glow } as React.CSSProperties}>
        <IdolPhoto idolId={idolId} size={1024} className="photo-frame w-28 sm:w-44" />
      </div>
      <p className="m-0 mt-2 max-w-full truncate font-display text-xl uppercase sm:text-2xl">{idol.name}</p>
      <p className="m-0 text-xs font-bold tracking-[0.2em] text-text-secondary uppercase">{idol.groupName ?? "Soloist"}</p>
      <div className="flex flex-wrap gap-1">
        <RatingBadge rating={idol.rating} />
        {idol.form && <FormBadge form={idol.form} recent={idol.recent} />}
      </div>
    </div>
  );
}

export function MatchHeader({ idolA, idolB, bestOf, h2h, theme = {} }: { idolA: string; idolB: string; bestOf: BestOf; h2h?: HeadToHead; theme?: MatchTheme }) {
  const a = useIdol(idolA);
  const b = useIdol(idolB);
  const odds = seriesOdds(a.rating + getForm(a.recent ?? []).modifier, b.rating + getForm(b.recent ?? []).modifier, bestOf);
  const color = `var(--color-${theme.grandFinal ? "brand-gold" : (theme.accent ?? "accent-bright")})`;
  return (
    <div>
      <div className="relative -mx-6 overflow-hidden px-6 py-5"
        style={{ background: `radial-gradient(30rem 14rem at 50% 0%, color-mix(in oklab, ${color} 30%, transparent), transparent 70%), linear-gradient(105deg, color-mix(in oklab, var(--color-accent) 45%, transparent) 0 49.6%, transparent 49.6% 50.4%, color-mix(in oklab, var(--color-tier-f) 70%, transparent) 50.4%), repeating-linear-gradient(-55deg, rgb(255 255 255 / 0.025) 0 2px, transparent 2px 10px)` }}>
        {theme.kicker && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-gothic text-ornament leading-none whitespace-nowrap opacity-[0.07]" style={{ color }}>
            {theme.kicker}
          </span>
        )}
        {theme.grandFinal && (
          <p className="relative z-[1] m-0 mb-3 flex items-center justify-center gap-2 text-xs font-extrabold tracking-[0.4em] uppercase" style={{ color }}>
            <Trophy aria-hidden="true" size={16} /> Grand final <Trophy aria-hidden="true" size={16} />
          </p>
        )}
        <div className="flex items-start justify-between gap-2">
          <Side idolId={idolA} align="left" glow="var(--color-accent-bright)" corner="Red corner" />
          <div className="relative z-[1] mt-10 shrink-0 text-center">
            <p className="m-0 font-gothic text-5xl leading-none sm:text-6xl" style={{ color, textShadow: `0 0 28px ${color}` }}>VS</p>
            <p className="m-0 mt-2"><span className="chip bg-bg-base/80 text-text-primary"><span>Best of {bestOf}</span></span></p>
          </div>
          <Side idolId={idolB} align="right" glow="var(--color-cool)" corner="Blue corner" />
        </div>
      </div>
      <div className="mt-4">
        <p className="sr-only">
          Win odds: {a.name} {pct(odds.A)}{bestOf === 4 ? `, draw ${pct(odds.D)}` : ""}, {b.name} {pct(odds.B)}
        </p>
        <div aria-hidden="true" className="flex h-3 -skew-x-12 overflow-hidden shadow-[0_0_24px_-8px_var(--color-accent-bright)]">
          <div className="bg-accent-bright" style={{ width: pct(odds.A) }} />
          <div className="bg-muted" style={{ width: pct(odds.D) }} />
          <div className="bg-cool" style={{ width: pct(odds.B) }} />
        </div>
        <div aria-hidden="true" className="score mt-2 flex justify-between text-lg">
          <span className="text-accent-bright">{pct(odds.A)}</span>
          {bestOf === 4 && <span className="text-muted">draw {pct(odds.D)}</span>}
          <span className="text-cool">{pct(odds.B)}</span>
        </div>
        {h2h && (
          <p className="m-0 mt-2 text-center text-sm text-text-secondary">
            H2H <span className="font-mono tabular-nums">{h2h.winsA}–{h2h.draws}–{h2h.winsB}</span>
          </p>
        )}
      </div>
    </div>
  );
}
