// Hall of Champions → champions per season (PRD §8; Update 2 ref "7 hall of champions"). One champion a season: a
// staggered column of season entries — torn photo, name, group, the final's score, runner-up and third. Several
// champions a season (the six D1/D2 leagues, B-Side, Music Bank): one season block with every champion side by side.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useBranding } from "../../data/branding";
import { IdolLink } from "../wiki/IdolLink";

export type Champion = { season: number; key: string; champion: string; runnerUp: string | null; third?: string | null; score: string | null };

function Podium({ t }: { t: Champion }) {
  return (
    <p className="m-0 text-xs text-text-secondary">
      {t.runnerUp && <>Runner-up <IdolLink id={t.runnerUp} className="text-text-primary" /></>}
      {t.third && <> · Ke-3 <IdolLink id={t.third} className="text-text-primary" /></>}
    </p>
  );
}

export function ChampionList({ titles }: { titles: Champion[] }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const seasons = [...new Set(titles.map((t) => t.season))];
  const many = seasons.some((s) => titles.filter((t) => t.season === s).length > 1);
  return (
    <ol className="m-0 list-none space-y-12 p-0" aria-label="Juara per season">
      {seasons.map((season, i) => {
        const list = titles.filter((t) => t.season === season);
        return (
          <li key={season} className={`relative ${!many && i % 2 ? "sm:ml-[18%]" : ""}`}>
            <p aria-hidden="true" className="m-0 font-gothic text-[clamp(3rem,8vw,5rem)] leading-none text-accent/40">{season}</p>
            <h3 className="kicker m-0 -mt-4 mb-4 text-accent-bright">Season {season}</h3>
            <div className={many ? "flex flex-wrap gap-x-8 gap-y-6" : ""}>
              {list.map((t) => (
                <article key={t.key} aria-label={`${label(t.key)} season ${season}`} className={`flex items-end gap-4 ${many ? "w-full sm:w-[calc(50%-1rem)] xl:w-[calc(33%-1.5rem)]" : ""}`}>
                  <IdolPhoto idolId={t.champion} size={many ? 256 : 1024} className={`photo-frame shrink-0 ${many ? "w-20" : "w-36 sm:w-44"}`} />
                  <div className="min-w-0 pb-1">
                    {many && <p className="kicker m-0 truncate text-text-secondary">{label(t.key)}</p>}
                    <IdolLink id={t.champion} className={`block truncate font-display ${many ? "text-xl" : "text-3xl"}`} />
                    <p className="m-0 text-sm text-accent-bright">{lookup(t.champion)?.groupName ?? "Soloist"}</p>
                    {t.score && <p className="m-0 font-mono text-sm">Final {t.score}</p>}
                    <Podium t={t} />
                  </div>
                </article>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
