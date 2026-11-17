// Dashboard champion cover (moved from Home, 2026-11-15; redesign brief: editorial cover + swiss punk): the last Unzure Cup
// champion huge, the word UNZURE as a giant outline behind the framed photo, an issue tag, a vertical label on the right.
// Before any Unzure final: the season name alone on the same cover.
import { IdolPhoto, useIdol } from "@sabung/ui";

export function ChampionCover({ seasonName, champion, championSeason }: { seasonName: string; champion: string | null; championSeason?: number }) {
  return (
    <section aria-label="Spotlight" className="relative isolate min-h-[26rem] overflow-hidden rounded-card px-5 pt-5 sm:px-10 sm:pt-8"
      style={{ background: "radial-gradient(50rem 30rem at 75% 110%, rgb(255 77 99 / 0.35), transparent 65%), linear-gradient(120deg, var(--color-accent), var(--color-surface-hover) 45%, var(--color-bg-base))" }}>
      <p aria-hidden="true" className="outline-text pointer-events-none absolute inset-x-0 bottom-2 -z-10 m-0 text-center font-display text-ornament-xl leading-none whitespace-nowrap opacity-70">
        {champion ? "UNZURE" : "SABUNG"}
      </p>
      <span aria-hidden="true" className="kicker absolute top-1/2 right-3 hidden -translate-y-1/2 text-text-secondary [writing-mode:vertical-rl] sm:block">Sabung Idol · {seasonName}</span>
      <div className="flex flex-wrap items-center gap-3">
        <span className="tag">Issue Nº {seasonName.replace(/\D/g, "") || "1"}</span>
        <span className="kicker text-on-accent">{champion ? `Unzure Cup champion · Season ${championSeason}` : "Sabung Idol"}</span>
      </div>
      <div className="mt-6 grid items-end gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-3 pb-10">
          {champion ? <ChampionName id={champion} /> : <p className="m-0 font-display text-hero">{seasonName}</p>}
          <p className="m-0 font-gothic text-2xl text-on-accent">{seasonName}</p>
        </div>
        {champion && <IdolPhoto idolId={champion} size={1024} className="photo-frame w-52 justify-self-center sm:w-72 md:mr-8" />}
      </div>
    </section>
  );
}

function ChampionName({ id }: { id: string }) {
  return <p className="m-0 max-w-[12ch] font-display text-hero break-words">{useIdol(id).name}</p>;
}
