// Award cabinet on the Idol Profile (2026-11-17): every season award she won, in award order, with the seasons.
// Same plain shelves as the trophy cabinet.
import { AWARDS } from "@sabung/engine";
import { Award } from "lucide-react";
import { AWARD_TEXT } from "../play/awardText";

export function AwardCabinet({ awards }: { awards: { key: string; season: number }[] }) {
  if (awards.length === 0) return <p className="m-0 text-sm text-text-secondary">No season awards yet.</p>;
  return (
    <ul className="m-0 list-none space-y-4 p-0" aria-label="Award cabinet">
      {AWARDS.filter((key) => awards.some((a) => a.key === key)).map((key) => {
        const won = awards.filter((a) => a.key === key);
        return (
          <li key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-border-strong pb-2">
            <Award aria-hidden="true" size={key === "mvi" || key === "iots" ? 32 : 24} strokeWidth={1.4} className="text-accent-bright" />
            <span className="kicker text-text-primary">{AWARD_TEXT[key].name} <span className="text-accent-bright">{won.length}×</span></span>
            <span className="font-mono text-xs text-text-secondary">{won.map((a) => `S${a.season}`).join(" · ")}</span>
          </li>
        );
      })}
    </ul>
  );
}
