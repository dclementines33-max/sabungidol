// End-of-season awards (2026-11-17 rework): MVI and Idol of the Season side by side as the headline, then MAMA (best
// group) and the rest in prestige order. Each winner shows how the award is worked out, her season stat line and, behind
// a button, the top 10 nominees with their numbers. Shown in Season Honours (season end and archive). Rules: PROGRESS.md.
import type { Award } from "@sabung/engine";
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { AWARD_TEXT } from "./awardText";
import type { HonoursDetail } from "./HonoursIdol";
import { SeasonStatLine } from "./SeasonStatLine";

export { AWARD_TEXT };
const HEADLINE = ["mvi", "iots"];

function Nominees({ a, name }: { a: Award; name: (id: string) => string }) {
  const [open, setOpen] = useState(false);
  if (a.top.length < 2) return null;
  return (
    <div className="w-full text-left">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright">
        {open ? "Hide nominees" : `Top ${a.top.length} nominees`}
      </button>
      {open && (
        <ol aria-label={`${AWARD_TEXT[a.key].name} nominees`} className="m-0 mt-2 list-none space-y-1 p-0 text-sm">
          {a.top.map((x, i) => (
            <li key={x.id} className="flex gap-2"><span className="w-5 shrink-0 text-right tabular-nums text-text-secondary">{i + 1}</span><span className="min-w-0 flex-1 truncate">{name(x.id)}</span><span className="tabular-nums">{x.value}</span></li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Winner({ a, d, name, lead }: { a: Award; d?: HonoursDetail; name: (id: string) => string; lead: boolean }) {
  const t = AWARD_TEXT[a.key];
  const group = a.key === "mama";
  return (
    <figure aria-label={t.what} className={`m-0 flex min-w-0 flex-col gap-3 ${lead ? "items-center text-center" : "border-t border-border pt-3"}`}>
      <div className={`flex gap-3 ${lead ? "flex-col items-center" : "items-center"}`}>
        {!group && <IdolPhoto idolId={a.id} size={lead ? 256 : 64} className={lead ? "photo-frame w-32" : "w-12 shrink-0 rounded-control"} />}
        <figcaption className="min-w-0">
          <span className={lead ? "block font-gothic text-4xl text-accent-bright" : "block text-xs font-bold tracking-[0.2em] text-accent-bright uppercase"}>{t.name}</span>
          <span className={`block font-display uppercase ${lead ? "text-2xl" : "text-base"}`}>{name(a.id)}</span>
          <span className="block text-sm text-text-secondary">{t.what} · {t.value(a.value)}</span>
        </figcaption>
      </div>
      <p className="m-0 text-xs text-text-secondary">{t.how}</p>
      {d && <SeasonStatLine d={d} small={!lead} />}
      <Nominees a={a} name={name} />
    </figure>
  );
}

export function AwardList({ awards, stats = [], groupName = (id) => id }: { awards: Award[]; stats?: HonoursDetail[]; groupName?: (id: string) => string }) {
  const lookup = useIdolLookup();
  if (!awards.length) return null;
  const nameOf = (a: Award) => (id: string) => (a.key === "mama" ? groupName(id) : lookup(id)?.name ?? id);
  const card = (a: Award, lead: boolean) => <Winner key={a.key} a={a} d={a.key === "mama" ? undefined : stats.find((s) => s.id === a.id)} name={nameOf(a)} lead={lead} />;
  return (
    <section aria-labelledby="awards" className="space-y-8">
      <h3 id="awards" className="kicker m-0 text-center">Season awards</h3>
      <div className="grid gap-10 sm:grid-cols-2">{awards.filter((a) => HEADLINE.includes(a.key)).map((a) => card(a, true))}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-6">{awards.filter((a) => !HEADLINE.includes(a.key)).map((a) => card(a, false))}</div>
    </section>
  );
}

export function SeasonAwards({ seasonId }: { seasonId: string }) {
  const live = typeof Worker !== "undefined";
  const { data = [] } = useQuery({ queryKey: ["season-awards", seasonId], queryFn: () => engine().seasonAwards(seasonId), enabled: live });
  const winners = [...new Set(data.filter((a) => a.key !== "mama").map((a) => a.id))];
  const { data: stats = [] } = useQuery({ queryKey: ["podium-detail", seasonId, winners], queryFn: () => engine().podiumDetail(seasonId, winners), enabled: live && winners.length > 0 });
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => engine().listGroups(), enabled: live });
  return <AwardList awards={data} stats={stats} groupName={(id) => groups.find((g) => g.id === id)?.name ?? id} />;
}
