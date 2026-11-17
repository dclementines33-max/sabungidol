// Home's top slot (2026-11-15): the #1 idol of all time = the top of Career Stats "Semua" in its default order (titles),
// over the user's porch photo (design/assets → public/home), darkened toward the right where the type sits.
import type { CareerRow } from "@sabung/engine";
import { IdolPhoto, useIdol } from "@sabung/ui";
import { IdolLink } from "../wiki/IdolLink";

const BG = "linear-gradient(90deg, rgb(1 0 3 / 0.3), rgb(1 0 3 / 0.85) 50%, var(--color-bg-base) 85%), linear-gradient(0deg, rgb(125 0 24 / 0.55), transparent 60%), url(/home/porch.webp)";

export function AllTimeTop({ row }: { row: CareerRow }) {
  const idol = useIdol(row.idolId);
  const stats = [[row.titles, "titles"], [row.matches, "matches"], [`${row.wins}–${row.draws}–${row.losses}`, "W–D–L"], [`${(row.winRate * 100).toFixed(1)}%`, "win rate"]] as const;
  return (
    <section aria-labelledby="all-time-top" className="relative isolate overflow-hidden rounded-card bg-cover bg-[position:20%_35%]" style={{ backgroundImage: BG }}>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-bg-base/60 md:hidden" />
      <p aria-hidden="true" className="outline-text pointer-events-none absolute -top-4 right-2 -z-10 m-0 font-display text-ornament-xl leading-none opacity-60">Nº1</p>
      <div className="ml-auto grid max-w-3xl items-end gap-6 px-5 pt-10 pb-8 sm:px-10 md:grid-cols-[auto_1fr] md:pt-20">
        <IdolPhoto idolId={row.idolId} size={1024} className="photo-frame w-44 -rotate-2 shadow-[0_0_80px_-12px_var(--color-winner)] sm:w-56" />
        <div className="min-w-0">
          <p className="m-0 flex flex-wrap items-center gap-3"><span className="tag bg-winner">#1 of all time</span><span className="kicker">Ranked by titles · Career Stats</span></p>
          <h2 id="all-time-top" className="m-0 mt-3 text-headline text-balance text-winner [text-shadow:0_0_40px_rgb(240_199_94/0.35)]"><IdolLink id={row.idolId} /></h2>
          <p className="m-0 mt-1 font-gothic text-2xl text-accent-bright">{idol.groupName ?? "Soloist"}</p>
          <dl className="m-0 mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {stats.map(([value, label]) => (
              <div key={label}>
                <dd className="score m-0 text-3xl">{value}</dd>
                <dt className="kicker text-text-secondary">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
