// Trophy cabinet on the Idol Profile (PRD §16): one shelf per competition with a trophy per title and its season,
// the big competitions in gold, the rest in the accent colour. Design round 2: each shelf a lit display-case panel.
import { Trophy } from "@sabung/ui/icons";
import { useBranding } from "../../data/branding";

const GOLD = new Set(["UZC", "IDL-PO", "DSG", "INK"]);

export function TrophyCabinet({ titles }: { titles: { comp: string; season: number }[] }) {
  const { label } = useBranding();
  if (titles.length === 0) return <p className="m-0 text-sm text-text-secondary">The trophy cabinet is still empty.</p>;
  const shelves = [...new Set(titles.map((t) => t.comp))].sort((a, b) => Number(GOLD.has(b)) - Number(GOLD.has(a)) || a.localeCompare(b));
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3" aria-label="Trophy cabinet">
      {shelves.map((comp) => {
        const won = titles.filter((t) => t.comp === comp);
        return (
          <li key={comp} className="panel p-4">
            <p className="kicker m-0 mb-2 text-text-secondary">{label(comp)} · <span className="text-accent-bright">{won.length}×</span></p>
            <ul className="m-0 flex list-none flex-wrap items-end gap-4 bg-[radial-gradient(14rem_3rem_at_50%_100%,color-mix(in_oklab,var(--color-winner)_22%,transparent),transparent_70%)] p-0 pb-2 shadow-[inset_0_-2px_0_color-mix(in_oklab,var(--color-winner)_55%,transparent)]">
              {won.map((t) => (
                <li key={t.season} className="flex flex-col items-center">
                  <Trophy aria-hidden="true" size={GOLD.has(comp) ? 40 : 30} strokeWidth={1.4} className={GOLD.has(comp) ? "icon-tone text-[#f5c451] drop-shadow-[0_0_12px_rgb(245_196_81/0.5)]" : "icon-tone text-accent-bright"} />
                  <span className="font-mono text-[10px] text-text-secondary">S{t.season}</span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
