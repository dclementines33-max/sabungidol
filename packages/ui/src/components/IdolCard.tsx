// Idol card (PRD §9 proposal): photo, name, group, tier, form, titles.
import { Trophy } from "lucide-react";
import { FormBadge } from "./FormBadge";
import { IdolPhoto } from "./IdolPhoto";
import { RatingBadge } from "./RatingBadge";
import { useIdol } from "./idolSource";

export function IdolCard({ idolId }: { idolId: string }) {
  const idol = useIdol(idolId);
  return (
    <article className="w-48 rounded-card border border-border bg-surface p-2">
      <IdolPhoto idolId={idolId} size={256} className="w-full" />
      <p className="m-0 mt-2 truncate font-display text-lg">{idol.name}</p>
      <p className="m-0 truncate text-sm text-text-secondary">{idol.groupName ?? "Soloist"}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <RatingBadge rating={idol.rating} />
        {idol.form && <FormBadge form={idol.form} recent={idol.recent} />}
        {!!idol.titles && (
          <span className="inline-flex items-center gap-1 text-xs text-accent-gold" aria-label={`${idol.titles} titles`}>
            <Trophy aria-hidden="true" size={14} strokeWidth={1.5} />
            <span aria-hidden="true" className="font-mono tabular-nums">{idol.titles}</span>
          </span>
        )}
      </div>
    </article>
  );
}
