// Idol Profile → Career (Update 2 ref "6 idol profile career"): a scope per competition (with its match count), then
// that scope's big numbers and three short summaries — scoring, results and streaks — following the format's stats.
import type { CareerRow } from "@sabung/engine";
import { useState } from "react";
import { compLabel } from "../wiki/compLabel";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function Summary({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section aria-label={title} className="panel min-w-56 flex-1 p-4">
      <h4 className="kicker m-0 mb-2 text-accent-bright">{title}</h4>
      <dl className="m-0 space-y-1 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-text-secondary">{k}</dt><dd className="m-0 font-mono tabular-nums">{v}</dd></div>)}</dl>
    </section>
  );
}

export function CareerScope({ rows }: { rows: CareerRow[] }) {
  const sorted = [...rows].sort((a, b) => (a.comp === "ALL" ? -1 : b.comp === "ALL" ? 1 : b.matches - a.matches));
  const [comp, setComp] = useState("ALL");
  const r = sorted.find((x) => x.comp === comp) ?? sorted[0];
  if (!r) return <p className="m-0 text-sm text-text-secondary">No matches yet.</p>;
  const cupOnly = r.comp === "SWS" || r.comp === "LCQ";
  const big: [string, string][] = [
    ["Win rate", pct(r.winRate)], ["Match", String(r.matches)],
    ...(cupOnly ? [] : [["Titles", String(r.titles)], ["Podium", String(r.titles + r.runnerUp + r.third)]] as [string, string][]),
    ["Game diff", signed(r.gameDiff)], ["Game / match", r.avgGames.toFixed(1)],
  ];
  const format: [string, string][] = r.comp === "D1" || r.comp === "D2" || r.comp === "IDL"
    ? [["League points", String(r.leaguePoints)], ["Best season points", String(r.bestLeagueSeasonPoints)], ["Best finish", String(r.bestPlacement ?? "–")], ["Unbeaten seasons", String(r.invincibleSeasons)]]
    : r.comp === "UZC" ? [["Out of groups", String(r.groupAdvance)], ["Out in groups", String(r.groupExit)], ["Final", String(r.finals)], ["Best finish", String(r.bestPlacement ?? "–")]]
      : cupOnly ? [["Through", String(r.groupAdvance)], ["Out", String(r.groupExit)], ["Seasons entered", String(r.seasons)]]
        : [["Final", String(r.finals)], ["Runner-up", String(r.runnerUp)], ["Best finish", String(r.bestPlacement ?? "–")], ["Seasons entered", String(r.seasons)]];
  return (
    <div className="space-y-8">
      <div role="group" aria-label="Career scope" className="flex flex-wrap gap-1">
        {sorted.map((x) => (
          <button key={x.comp} type="button" aria-pressed={x.comp === r.comp} onClick={() => setComp(x.comp)}
            className={`-skew-x-12 rounded-[3px] px-3 py-1.5 text-xs font-bold tracking-[0.1em] uppercase ${x.comp === r.comp ? "bg-accent text-on-accent shadow-[0_8px_22px_-10px_var(--color-accent-bright)]" : "bg-stage-hi/80 text-text-secondary hover:text-text-primary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>
            <span className="inline-block skew-x-12">{compLabel(x.comp)} <span className="font-mono opacity-80">({x.matches})</span></span>
          </button>
        ))}
      </div>
      <dl className="m-0 flex flex-wrap gap-x-12 gap-y-6">
        {big.map(([label, value], i) => (
          <div key={label} className={i % 2 ? "sm:mt-6" : ""}>
            <dt className="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{label}</dt>
            <dd className="score m-0 mt-1 text-headline leading-none">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-8">
        <Summary title="Results" rows={[["Won / drawn / lost", `${r.wins} / ${r.draws} / ${r.losses}`], ["Games won / lost", `${r.gamesFor} / ${r.gamesAgainst}`], ["Reverse sweep", String(r.reverseSweeps)], ["Giant kill", String(r.giantKills)]]} />
        <Summary title={compLabel(r.comp)} rows={format} />
        <Summary title="Streaks & peaks" rows={[["Longest win streak", String(r.bestWinStreak)], ["Longest unbeaten run", String(r.bestUnbeatenStreak)], ["Longest losing streak", String(r.bestLoseStreak)], ["Peak rating", String(r.highestRating)]]} />
      </div>
    </div>
  );
}
