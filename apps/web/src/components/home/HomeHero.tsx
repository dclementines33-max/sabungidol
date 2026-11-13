// Home hero (PRD §8; design/refs "another ref": a big photo, huge capital headline): the last Unzure Cup
// champion with the season name. Before any Unzure final, the season name alone.
import { IdolPhoto, useIdol } from "@sabung/ui";

export function HomeHero({ seasonName, champion, championSeason }: { seasonName: string; champion: string | null; championSeason?: number }) {
  return (
    <section aria-label="Sorotan" className="relative flex min-h-64 flex-col justify-end overflow-hidden panel bg-accent p-6 text-on-accent sm:flex-row sm:items-end sm:justify-between">
      <div className="relative z-[1] space-y-2">
        <p className="m-0 text-xs tracking-widest uppercase">{champion ? `Juara Unzure Cup · Season ${championSeason}` : "Sabung Idol"}</p>
        {champion && <ChampionName id={champion} />}
        <p className="m-0 font-display text-xl uppercase">{seasonName}</p>
      </div>
      {champion && <IdolPhoto idolId={champion} size={1024} className="mt-4 w-40 shrink-0 sm:mt-0 sm:w-56" />}
    </section>
  );
}

function ChampionName({ id }: { id: string }) {
  return <p className="m-0 font-display text-2xl leading-none font-bold break-words uppercase sm:text-3xl">{useIdol(id).name}</p>;
}
