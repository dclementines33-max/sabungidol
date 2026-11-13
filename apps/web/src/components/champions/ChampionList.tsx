// Hall of Champions → champions per season (PRD §8): photo, champion, runner-up, final score.
import { IdolPhoto } from "@sabung/ui";
import { useBranding } from "../../data/branding";
import { IdolLink } from "../wiki/IdolLink";

export type Champion = { season: number; key: string; champion: string; runnerUp: string | null; score: string | null };

export function ChampionList({ titles }: { titles: Champion[] }) {
  const { label } = useBranding();
  return (
    <ol className="m-0 list-none divide-y divide-border rounded-card border border-border p-0 text-sm" aria-label="Juara per season">
      {titles.map((t) => (
        <li key={`${t.season}-${t.key}`} className="flex items-center gap-3 px-3 py-2">
          <span className="w-10 font-mono text-text-secondary">S{t.season}</span>
          <IdolPhoto idolId={t.champion} size={64} className="w-10" />
          <div className="min-w-0 flex-1">
            <IdolLink id={t.champion} className="font-semibold" />
            <p className="m-0 truncate text-text-secondary">{label(t.key)}{t.runnerUp && <> · runner-up <IdolLink id={t.runnerUp} className="text-text-secondary" /></>}</p>
          </div>
          {t.score && <span className="font-mono tabular-nums">{t.score}</span>}
        </li>
      ))}
    </ol>
  );
}
