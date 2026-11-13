// Idol Profile → Career (Update 2 ref "6 idol profile career"): a scope per competition (with its match count), then
// that scope's big numbers and three short summaries — scoring, results and streaks — following the format's stats.
import type { CareerRow } from "@sabung/engine";
import { useState } from "react";
import { compLabel } from "../wiki/compLabel";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function Summary({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section aria-label={title} className="min-w-56 flex-1 border-t border-border pt-3">
      <h4 className="kicker m-0 mb-2 text-accent-bright">{title}</h4>
      <dl className="m-0 space-y-1 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-text-secondary">{k}</dt><dd className="m-0 font-mono tabular-nums">{v}</dd></div>)}</dl>
    </section>
  );
}

export function CareerScope({ rows }: { rows: CareerRow[] }) {
  const sorted = [...rows].sort((a, b) => (a.comp === "ALL" ? -1 : b.comp === "ALL" ? 1 : b.matches - a.matches));
  const [comp, setComp] = useState("ALL");
  const r = sorted.find((x) => x.comp === comp) ?? sorted[0];
  if (!r) return <p className="m-0 text-sm text-text-secondary">Belum ada match.</p>;
  const cupOnly = r.comp === "SWS" || r.comp === "LCQ";
  const big: [string, string][] = [
    ["Win rate", pct(r.winRate)], ["Match", String(r.matches)],
    ...(cupOnly ? [] : [["Gelar", String(r.titles)], ["Podium", String(r.titles + r.runnerUp + r.third)]] as [string, string][]),
    ["Selisih game", signed(r.gameDiff)], ["Game / match", r.avgGames.toFixed(1)],
  ];
  const format: [string, string][] = r.comp === "D1" || r.comp === "D2" || r.comp === "IDL"
    ? [["Poin liga", String(r.leaguePoints)], ["Poin terbaik semusim", String(r.bestLeagueSeasonPoints)], ["Posisi terbaik", String(r.bestPlacement ?? "–")], ["Season tak terkalahkan", String(r.invincibleSeasons)]]
    : r.comp === "UZC" ? [["Lolos grup", String(r.groupAdvance)], ["Gugur di grup", String(r.groupExit)], ["Final", String(r.finals)], ["Posisi terbaik", String(r.bestPlacement ?? "–")]]
      : cupOnly ? [["Lolos", String(r.groupAdvance)], ["Gugur", String(r.groupExit)], ["Season ikut", String(r.seasons)]]
        : [["Final", String(r.finals)], ["Runner-up", String(r.runnerUp)], ["Posisi terbaik", String(r.bestPlacement ?? "–")], ["Season ikut", String(r.seasons)]];
  return (
    <div className="space-y-8">
      <div role="group" aria-label="Scope karier" className="flex flex-wrap gap-1">
        {sorted.map((x) => (
          <button key={x.comp} type="button" aria-pressed={x.comp === r.comp} onClick={() => setComp(x.comp)}
            className={`px-3 py-1.5 text-xs font-bold uppercase ${x.comp === r.comp ? "bg-accent text-on-accent" : "bg-surface-hover/60 text-text-secondary hover:text-text-primary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>
            {compLabel(x.comp)} <span className="font-mono opacity-80">({x.matches})</span>
          </button>
        ))}
      </div>
      <dl className="m-0 flex flex-wrap gap-x-12 gap-y-6">
        {big.map(([label, value], i) => (
          <div key={label} className={i % 2 ? "sm:mt-6" : ""}>
            <dt className="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{label}</dt>
            <dd className="m-0 font-display text-[clamp(2rem,5vw,3.5rem)] leading-none tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-8">
        <Summary title="Hasil" rows={[["Menang / seri / kalah", `${r.wins} / ${r.draws} / ${r.losses}`], ["Game menang / kalah", `${r.gamesFor} / ${r.gamesAgainst}`], ["Reverse sweep", String(r.reverseSweeps)], ["Giant kill", String(r.giantKills)]]} />
        <Summary title={compLabel(r.comp)} rows={format} />
        <Summary title="Streak & puncak" rows={[["Menang beruntun terpanjang", String(r.bestWinStreak)], ["Tak terkalahkan terpanjang", String(r.bestUnbeatenStreak)], ["Kalah beruntun terpanjang", String(r.bestLoseStreak)], ["Rating tertinggi", String(r.highestRating)]]} />
      </div>
    </div>
  );
}
