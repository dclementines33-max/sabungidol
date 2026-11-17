// Idol Profile → Seasons (PRD §8): each season's final places, and the division path (its league that season).
import { useBranding } from "../../data/branding";

type Placement = { season: number; comp: string; finalRank: number };

export function ProfileSeasons({ placements }: { placements: Placement[] }) {
  const { label } = useBranding();
  const seasons = [...new Set(placements.map((p) => p.season))].reverse();
  if (!seasons.length) return <p className="text-sm text-text-secondary">No season finished yet.</p>;
  return (
    <ol className="m-0 list-none space-y-4 p-0">
      {seasons.map((s) => {
        const rows = placements.filter((p) => p.season === s);
        const league = rows.find((p) => /^D[12][A-F]$/.test(p.comp));
        return (
          <li key={s} className="panel p-3">
            <p className="section-title text-lg">Season {s} <span className="text-sm text-text-secondary">{league ? `· Division ${league.comp[1]}` : ""}</span></p>
            <ul className="m-0 mt-2 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-1 p-0 text-sm">
              {rows.map((p) => <li key={p.comp} className="flex items-center gap-2 rounded-[3px] bg-stage-hi/50 px-2 py-1"><span className={`score w-9 ${p.finalRank === 1 ? "text-winner" : "text-accent-bright"}`}>#{p.finalRank}</span>{label(p.comp)}</li>)}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
