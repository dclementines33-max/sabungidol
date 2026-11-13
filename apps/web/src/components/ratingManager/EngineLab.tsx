// Engine Lab (PRD §8 Rating Manager, §5.1): two idols → chance per game and per Best of N, then 100 or
// 1,000 simulated matches with a histogram of final scores. Uses the season's Engine Tuning and the
// draft ratings; nothing is saved.
import { type Side, type Tuning, gameWinProbability, matchRng, seriesOdds, simulateSeries } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { Button, SearchableIdolSelect, useIdolLookup } from "@sabung/ui";
import { useState } from "react";

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function EngineLab({ idolIds, ratingOf, tuning }: { idolIds: string[]; ratingOf: (id: string) => number; tuning: Tuning }) {
  const lookup = useIdolLookup();
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const [bestOf, setBestOf] = useState<BestOf>(5);
  const [scores, setScores] = useState<Map<string, number> | null>(null);
  const ready = a && b && a !== b;
  const run = (n: number) => {
    const out = new Map<string, number>();
    const seed = String(Date.now());
    for (let i = 0; i < n; i++) {
      const s = simulateSeries({ ratingA: ratingOf(a!), ratingB: ratingOf(b!), bestOf, rng: matchRng(seed, `lab-${i}`), tuning });
      const key = `${s.scoreA}–${s.scoreB}`;
      out.set(key, (out.get(key) ?? 0) + 1);
    }
    setScores(out);
  };
  const odds = ready ? seriesOdds(ratingOf(a), ratingOf(b), bestOf, tuning.scale) : null;
  const total = scores ? [...scores.values()].reduce((s, x) => s + x, 0) : 0;
  // Final scores ordered from A's biggest win to B's biggest win.
  const rows = scores ? [...scores.entries()].sort(([x], [y]) => { const [xa, xb] = x.split("–").map(Number); const [ya, yb] = y.split("–").map(Number); return xb! - xa! - (yb! - ya!); }) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <SearchableIdolSelect label="Idol A" idolIds={idolIds} value={a} onChange={(v) => { setA(v); setScores(null); }} />
        <SearchableIdolSelect label="Idol B" idolIds={idolIds} value={b} onChange={(v) => { setB(v); setScores(null); }} />
        <label className="text-sm text-text-secondary">Format
          <select value={bestOf} onChange={(e) => { setBestOf(Number(e.target.value) as BestOf); setScores(null); }}
            className="mt-1 block w-28 rounded-control border border-border-strong bg-surface px-2 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright">
            {[3, 4, 5, 7].map((n) => <option key={n} value={n}>Bo{n}</option>)}
          </select>
        </label>
      </div>
      {ready && odds && (
        <>
          <p className="m-0 text-sm">
            Per game: <span className="font-mono text-accent-bright">{pct(gameWinProbability(ratingOf(a), ratingOf(b), tuning.scale))}</span> {lookup(a)?.name} ·
            Bo{bestOf}: {lookup(a)?.name} <span className="font-mono text-accent-bright">{pct(odds.A)}</span>
            {bestOf === 4 && <> · seri <span className="font-mono">{pct(odds.D)}</span></>} · {lookup(b)?.name} <span className="font-mono text-cool">{pct(odds.B)}</span>
            <span className="text-text-secondary"> (sebelum variance dan form)</span>
          </p>
          <div className="flex gap-2"><Button onClick={() => run(100)}>Simulasi 100</Button><Button onClick={() => run(1000)}>Simulasi 1.000</Button></div>
        </>
      )}
      {scores && (
        <figure className="m-0">
          <figcaption className="mb-2 text-sm text-text-secondary">Skor akhir dari {total.toLocaleString("id-ID")} match ({lookup(a!)?.name} – {lookup(b!)?.name})</figcaption>
          <ul className="m-0 list-none space-y-1 p-0">
            {rows.map(([score, count]) => {
              const [sa, sb] = score.split("–").map(Number);
              const winner: Side | "D" = sa! > sb! ? "A" : sb! > sa! ? "B" : "D";
              return (
                <li key={score} className="grid grid-cols-[3rem_1fr_4rem] items-center gap-2 font-mono text-xs tabular-nums">
                  <span>{score}</span>
                  <span className="h-3 rounded-sm bg-surface-hover"><span className={`block h-full rounded-sm ${winner === "A" ? "bg-accent-bright" : winner === "B" ? "bg-cool" : "bg-muted"}`} style={{ width: pct(count / total) }} /></span>
                  <span className="text-right">{pct(count / total)}</span>
                </li>
              );
            })}
          </ul>
        </figure>
      )}
    </div>
  );
}
