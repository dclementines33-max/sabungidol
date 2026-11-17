// The group's trophy road: every season its members won something, newest first, each title with the member who won it.
// The season with the most titles is marked as the group's golden era.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Crown, Trophy } from "@sabung/ui/icons";
import { useBranding } from "../../data/branding";

type Title = { season: number; key: string; champion: string };

export function GroupTrophyTimeline({ titles }: { titles: Title[] }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const seasons = [...new Set(titles.map((t) => t.season))].sort((a, b) => b - a);
  const count = (s: number) => titles.filter((t) => t.season === s).length;
  const best = seasons.reduce<number | null>((top, s) => (top === null || count(s) > count(top) ? s : top), null);
  return (
    <section aria-labelledby="trophy-road" className="space-y-3">
      <h3 id="trophy-road" className="section-title m-0">Trophy road</h3>
      {seasons.length === 0 ? <p className="m-0 text-sm text-text-secondary">No titles yet. The first one is still out there.</p> : (
        <ol className="m-0 mt-5 list-none space-y-4 border-l-2 border-accent-bright/40 p-0 pl-5">
          {seasons.map((s) => (
            <li key={s} className="relative">
              <span aria-hidden="true" className={`absolute top-2 -left-[1.95rem] size-4 rotate-45 ${s === best ? "bg-winner shadow-[0_0_14px_var(--color-winner)]" : "bg-accent-bright"}`} />
              <p className="m-0 flex flex-wrap items-center gap-3">
                <span className="score text-2xl">Season {s}</span>
                {s === best && count(s) > 1 && <span className="chip bg-winner text-on-fill"><span className="inline-flex items-center gap-1"><Crown size={12} className="icon-tone" />Golden era</span></span>}
                <span className="kicker text-text-secondary">{count(s)} title{count(s) === 1 ? "" : "s"}</span>
              </p>
              <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
                {titles.filter((t) => t.season === s).map((t) => (
                  <li key={`${t.key}|${t.champion}`} className="panel flex items-center gap-2 py-1 pr-3 pl-1">
                    <IdolPhoto idolId={t.champion} size={64} className="h-9 w-7 rounded-[3px]" />
                    <Trophy size={16} className="icon-tone text-winner" />
                    <span className="text-sm"><b className="font-display">{label(t.key)}</b> · {lookup(t.champion)?.name ?? t.champion}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
