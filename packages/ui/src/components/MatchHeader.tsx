// Top of the match screen (PRD §9): two big photos VS, name, group, rating, form,
// chance to win (engine, before variance) and a short head-to-head.
import { getForm, seriesOdds } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { FormBadge } from "./FormBadge";
import { IdolPhoto } from "./IdolPhoto";
import { RatingBadge } from "./RatingBadge";
import { useIdol } from "./idolSource";

export type HeadToHead = { winsA: number; draws: number; winsB: number };
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Side({ idolId, align }: { idolId: string; align: "left" | "right" }) {
  const idol = useIdol(idolId);
  return (
    <div className={`flex flex-col gap-1 ${align === "right" ? "items-end text-right" : "items-start"}`}>
      <IdolPhoto idolId={idolId} size={1024} className="w-28 sm:w-40" />
      <p className="m-0 mt-1 font-display text-lg">{idol.name}</p>
      <p className="m-0 text-sm text-text-secondary">{idol.groupName ?? "Soloist"}</p>
      <div className="flex flex-wrap gap-1">
        <RatingBadge rating={idol.rating} />
        {idol.form && <FormBadge form={idol.form} recent={idol.recent} />}
      </div>
    </div>
  );
}

export function MatchHeader({ idolA, idolB, bestOf, h2h }: { idolA: string; idolB: string; bestOf: BestOf; h2h?: HeadToHead }) {
  const a = useIdol(idolA);
  const b = useIdol(idolB);
  const odds = seriesOdds(a.rating + getForm(a.recent ?? []).modifier, b.rating + getForm(b.recent ?? []).modifier, bestOf);
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <Side idolId={idolA} align="left" />
        <div className="mt-12 text-center">
          <p className="m-0 font-display text-2xl">VS</p>
          <p className="m-0 font-mono text-xs text-text-secondary">Bo{bestOf}</p>
        </div>
        <Side idolId={idolB} align="right" />
      </div>
      <div className="mt-4">
        <p className="sr-only">
          Peluang menang: {a.name} {pct(odds.A)}{bestOf === 4 ? `, seri ${pct(odds.D)}` : ""}, {b.name} {pct(odds.B)}
        </p>
        <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-full">
          <div className="bg-accent-coral" style={{ width: pct(odds.A) }} />
          <div className="bg-neutral-taupe" style={{ width: pct(odds.D) }} />
          <div className="bg-accent-sky" style={{ width: pct(odds.B) }} />
        </div>
        <div aria-hidden="true" className="mt-1 flex justify-between font-mono text-xs tabular-nums">
          <span className="text-accent-coral">{pct(odds.A)}</span>
          {bestOf === 4 && <span className="text-neutral-taupe">seri {pct(odds.D)}</span>}
          <span className="text-accent-sky">{pct(odds.B)}</span>
        </div>
        {h2h && (
          <p className="m-0 mt-2 text-center text-sm text-text-secondary">
            H2H <span className="font-mono tabular-nums">{h2h.winsA}–{h2h.draws}–{h2h.winsB}</span>
          </p>
        )}
      </div>
    </div>
  );
}
