// Idol Profile → Seasons (PRD §8): each season's final places, and the division path (its league that season).
import { useBranding } from "../../data/branding";

type Placement = { season: number; comp: string; finalRank: number };

export function ProfileSeasons({ placements }: { placements: Placement[] }) {
  const { label } = useBranding();
  const seasons = [...new Set(placements.map((p) => p.season))].reverse();
  if (!seasons.length) return <p className="text-sm text-text-secondary">Belum ada season yang selesai.</p>;
  return (
    <ol className="m-0 list-none space-y-4 p-0">
      {seasons.map((s) => {
        const rows = placements.filter((p) => p.season === s);
        const league = rows.find((p) => /^D[12][A-F]$/.test(p.comp));
        return (
          <li key={s} className="panel p-3">
            <p className="m-0 font-display text-lg">Season {s} <span className="text-sm text-text-secondary">{league ? `· Divisi ${league.comp[1]}` : ""}</span></p>
            <ul className="m-0 mt-2 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-1 p-0 text-sm">
              {rows.map((p) => <li key={p.comp}>{label(p.comp)}: <span className="font-mono">#{p.finalRank}</span></li>)}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
