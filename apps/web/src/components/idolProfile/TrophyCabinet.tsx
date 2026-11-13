// Trophy cabinet on the Idol Profile (PRD §16): one shelf per competition with a trophy per title and its season,
// the big competitions in gold, the rest in the accent colour. Shelves are plain lines, not boxes.
import { Trophy } from "lucide-react";
import { useBranding } from "../../data/branding";

const GOLD = new Set(["UZC", "IDL-PO", "DSG", "INK"]);

export function TrophyCabinet({ titles }: { titles: { comp: string; season: number }[] }) {
  const { label } = useBranding();
  if (titles.length === 0) return <p className="m-0 text-sm text-text-secondary">Lemari piala masih kosong.</p>;
  const shelves = [...new Set(titles.map((t) => t.comp))].sort((a, b) => Number(GOLD.has(b)) - Number(GOLD.has(a)) || a.localeCompare(b));
  return (
    <ul className="m-0 list-none space-y-5 p-0" aria-label="Lemari piala">
      {shelves.map((comp) => {
        const won = titles.filter((t) => t.comp === comp);
        return (
          <li key={comp} className="border-b-2 border-border-strong pb-2">
            <p className="kicker m-0 mb-2 text-text-secondary">{label(comp)} · <span className="text-accent-bright">{won.length}×</span></p>
            <ul className="m-0 flex list-none flex-wrap items-end gap-4 p-0">
              {won.map((t) => (
                <li key={t.season} className="flex flex-col items-center">
                  <Trophy aria-hidden="true" size={GOLD.has(comp) ? 40 : 30} strokeWidth={1.4} className={GOLD.has(comp) ? "text-[#f5c451] drop-shadow-[0_0_12px_rgb(245_196_81/0.5)]" : "text-accent-bright"} />
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
