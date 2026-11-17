// The group's award shelf: every season award its members won (count + who), and the MAMA seasons as gold plates.
import { useIdolLookup } from "@sabung/ui";
import { Award } from "@sabung/ui/icons";
import { AWARD_TEXT } from "../play/awardText";
import type { AwardKey } from "@sabung/engine";

type Win = { season: number; key: string; id: string };

export function GroupAwards({ wins, mama }: { wins: Win[]; mama: number[] }) {
  const lookup = useIdolLookup();
  const keys = [...new Set(wins.map((w) => w.key))] as AwardKey[];
  if (keys.length === 0 && mama.length === 0) return null;
  return (
    <section aria-labelledby="group-awards" className="space-y-3">
      <h3 id="group-awards" className="section-title m-0">Award shelf</h3>
      {mama.length > 0 && (
        <p className="m-0 flex flex-wrap items-center gap-2">
          <span className="kicker text-winner">MAMA</span>
          {mama.map((s) => <span key={s} className="chip bg-winner text-on-fill"><span>Season {s}</span></span>)}
        </p>
      )}
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {keys.map((k) => {
          const mine = wins.filter((w) => w.key === k);
          const who = [...new Set(mine.map((w) => lookup(w.id)?.name ?? w.id))];
          return (
            <li key={k} className="panel flex items-center gap-3 p-3">
              <Award size={28} strokeWidth={1.5} className="icon-tone shrink-0 text-accent-bright" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display">{AWARD_TEXT[k].name}</span>
                <span className="block truncate text-xs text-text-secondary">{who.join(", ")}</span>
              </span>
              <span className="score text-2xl text-winner">×{mine.length}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
