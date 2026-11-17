// One official rivalry as a fight poster: its name, the tier, the two idols facing each other (red and blue corner), the
// series record with a split bar, the heat in flames. The whole card opens the pair in Head to Head.
import { RIVALRY_TIER, type Rivalry } from "@sabung/engine";
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Flame } from "@sabung/ui/icons";
import { Link } from "@tanstack/react-router";
import { TIER_COLOR, flames } from "./tierStyle";

export function RivalryCard({ r, big = false }: { r: Rivalry; big?: boolean }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const color = TIER_COLOR[r.tier];
  const pctA = ((r.winsA + r.draws / 2) / r.meetings) * 100;
  return (
    <Link
      to="/wiki/h2h" search={{ a: r.a, b: r.b }}
      className="stage group relative isolate block overflow-hidden rounded-card p-4 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-accent-bright"
      style={{ boxShadow: `inset 0 3px 0 ${color}, 0 18px 40px -24px ${color}` }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(100deg,color-mix(in_oklab,var(--color-accent)_45%,transparent)_0_49.5%,transparent_49.5%_50.5%,color-mix(in_oklab,var(--color-tier-f)_70%,transparent)_50.5%)] opacity-70" />
      <p className="m-0 flex items-center justify-between gap-2">
        <span className="chip text-on-fill" style={{ background: color }}><span>{RIVALRY_TIER[r.tier]}</span></span>
        <span aria-hidden="true" className="flex gap-0.5">{Array.from({ length: flames(r.heat) }, (_, i) => <Flame key={i} size={14} className="icon-tone text-winner" />)}</span>
      </p>
      <p className={`m-0 mt-2 font-gothic leading-none ${big ? "text-3xl sm:text-4xl" : "text-xl"}`} style={{ color }}>{r.name}</p>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <span className="flex min-w-0 flex-col items-start gap-1">
          <IdolPhoto idolId={r.a} size={256} className={`photo-frame -rotate-3 transition-transform group-hover:-rotate-6 ${big ? "w-24 sm:w-28" : "w-16"}`} />
          <span className={`max-w-full truncate font-display uppercase ${r.leader === r.a ? "text-text-primary" : "text-text-secondary"}`}>{name(r.a)}</span>
        </span>
        <span className="text-center">
          <span className="vs block text-2xl uppercase">vs</span>
          <span className="score mt-1 block text-lg">{r.winsA}–{r.draws}–{r.winsB}</span>
        </span>
        <span className="flex min-w-0 flex-col items-end gap-1">
          <IdolPhoto idolId={r.b} size={256} className={`photo-frame rotate-3 transition-transform group-hover:rotate-6 ${big ? "w-24 sm:w-28" : "w-16"}`} />
          <span className={`max-w-full truncate text-right font-display uppercase ${r.leader === r.b ? "text-text-primary" : "text-text-secondary"}`}>{name(r.b)}</span>
        </span>
      </div>
      <span aria-hidden="true" className="mt-3 flex h-2 -skew-x-12 overflow-hidden rounded-[2px]">
        <span className="bg-accent-bright" style={{ width: `${pctA}%` }} /><span className="flex-1 bg-cool" />
      </span>
      <p className="kicker m-0 mt-2 text-text-secondary">{r.meetings} meetings · {r.leader ? `${name(r.leader)} leads` : "dead level"}</p>
    </Link>
  );
}
