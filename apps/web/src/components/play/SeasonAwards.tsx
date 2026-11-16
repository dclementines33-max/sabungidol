// End-of-season awards (2026-11-17, the gala): MVI as the headline award, the other nine in prestige order below it.
// Shown in Season Honours, so both the season's end and its archive page have them. Rules: docs/PROGRESS.md.
import type { Award, AwardKey } from "@sabung/engine";
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { engine } from "../../data/engineClient";

export const AWARD_TEXT: Record<AwardKey, { name: string; what: string; value: (v: number) => string }> = {
  mvi: { name: "MVI", what: "Most Valuable Idol", value: (v) => `${v} MVI score` },
  "golden-disk": { name: "Golden Disk", what: "Most titles", value: (v) => `${v} ${v === 1 ? "title" : "titles"}` },
  "chart-topper": { name: "Chart Topper", what: "Most matchdays at #1 (The Idols + Division 1)", value: (v) => `${v} matchdays at #1` },
  encore: { name: "Encore", what: "Most wins", value: (v) => `${v} wins` },
  daebak: { name: "Daebak", what: "Fewest losses", value: (v) => `${v} ${v === 1 ? "loss" : "losses"}` },
  "hit-maker": { name: "Hit Maker", what: "Most games won", value: (v) => `${v} games won` },
  unbreakable: { name: "Unbreakable", what: "Fewest games conceded per match", value: (v) => `${v} conceded per match` },
  "trend-setter": { name: "Trend Setter", what: "Most consistent across competitions", value: (v) => `${v} consistency` },
  "glow-up": { name: "Glow Up", what: "Biggest rating growth", value: (v) => `+${v} rating` },
  "hallyu-wave": { name: "Hallyu Wave", what: "Most matches played", value: (v) => `${v} matches` },
};

export function AwardList({ awards }: { awards: Award[] }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const [lead, ...rest] = awards;
  if (!lead) return null;
  return (
    <section aria-labelledby="awards" className="space-y-6">
      <h3 id="awards" className="kicker m-0 text-center">Season awards</h3>
      <figure className="m-0 flex flex-col items-center gap-3 text-center" aria-label={AWARD_TEXT[lead.key].what}>
        <IdolPhoto idolId={lead.idol} size={256} className="photo-frame w-32" />
        <p className="m-0 font-gothic text-4xl text-accent-bright">{AWARD_TEXT[lead.key].name}</p>
        <p className="m-0 font-display text-2xl uppercase">{name(lead.idol)}</p>
        <p className="m-0 text-sm text-text-secondary">{AWARD_TEXT[lead.key].what} · {AWARD_TEXT[lead.key].value(lead.value)}</p>
      </figure>
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4 p-0">
        {rest.map((a) => (
          <li key={a.key} className="flex items-center gap-3 border-t border-border pt-3">
            <IdolPhoto idolId={a.idol} size={64} className="w-12 shrink-0 rounded-control" />
            <span className="min-w-0">
              <span className="block text-xs font-bold tracking-[0.2em] text-accent-bright uppercase">{AWARD_TEXT[a.key].name}</span>
              <span className="block font-display text-base uppercase">{name(a.idol)}</span>
              <span className="block text-xs text-text-secondary">{AWARD_TEXT[a.key].what} · {AWARD_TEXT[a.key].value(a.value)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SeasonAwards({ seasonId }: { seasonId: string }) {
  const { data = [] } = useQuery({ queryKey: ["season-awards", seasonId], queryFn: () => engine().seasonAwards(seasonId), enabled: typeof Worker !== "undefined" });
  return <AwardList awards={data} />;
}
