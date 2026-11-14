// The random picker between two idols (PRD §9; redesigned 2026-11-15 as a "spotlight duel", the wheel read as a circus
// prop): both portraits on a dark stage, a spotlight swings between them — fast, then slower — and stops on the game's
// winner, who lights up while the other drops to grey. One spin = one game; "Spin all" keeps going until the series is
// over. The draw is unchanged: one random number per game, below 0.5 = A (50:50). Kept only when Accept is pressed.
import { type Side, seriesState } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { IdolPhoto } from "./IdolPhoto";
import { useIdol } from "./idolSource";

export const SPIN_MS = 2600;
export const PAUSE_MS = 500; // between the spins of "Spin all"
const TONE: Record<Side, string> = { A: "accent-bright", B: "cool" };
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// When the light switches sides during one spin: quick at first, slowing down, an odd or even count so it ends on the
// winner, and a last hold before the stop.
export function sweep(from: Side, winner: Side): number[] {
  const gaps: number[] = [];
  let total = 0;
  for (let d = 70; total + d < SPIN_MS - 350; d *= 1.2) { gaps.push(d); total += d; }
  const endsRight = (from === winner) === (gaps.length % 2 === 0); // an even number of flips keeps the side
  if (!endsRight) { const first = gaps.shift()!; gaps[0]! += first; } // drop one flip so the light ends on the winner
  let at = 0;
  return gaps.map((d) => (at += d));
}

export function WheelPicker({ idolA, idolB, bestOf, games, onChange, random = Math.random }: {
  idolA: string;
  idolB: string;
  bestOf: BestOf;
  games: Side[];
  onChange: (games: Side[]) => void;
  random?: () => number;
}) {
  const a = useIdol(idolA);
  const b = useIdol(idolB);
  const [lit, setLit] = useState<Side | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [auto, setAuto] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined); // the pause before the next "Spin all" spin
  const stop = useRef<ReturnType<typeof setTimeout>>(undefined); // the stop; its own timer, or the pause clean-up cancels it
  const flips = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(stop.current); flips.current.forEach(clearTimeout); }, []);
  const { scoreA, scoreB, result } = seriesState(bestOf, games);

  const spin = () => {
    const winner: Side = random() < 0.5 ? "A" : "B";
    const quick = reducedMotion();
    setSpinning(true);
    if (!quick) {
      const start: Side = lit ?? "A";
      setLit(start);
      flips.current = sweep(start, winner).map((at, i) => setTimeout(() => setLit(i % 2 === 0 ? (start === "A" ? "B" : "A") : start), at));
    }
    stop.current = setTimeout(() => {
      setLit(winner);
      setSpinning(false);
      onChange([...games, winner]);
    }, quick ? 0 : SPIN_MS);
  };

  // "Spin all": after each stop, wait a moment and spin again while the series is still open.
  useEffect(() => {
    if (!auto || spinning) return;
    if (result) { setAuto(false); return; }
    timer.current = setTimeout(spin, games.length === 0 || reducedMotion() ? 0 : PAUSE_MS);
    return () => clearTimeout(timer.current);
  }, [auto, spinning, games.length, result]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = spinning || auto;
  const seriesWinner = result && result !== "D" ? (result === "A" ? a.name : b.name) : null;
  const portrait = (side: Side, idolId: string, name: string) => {
    const on = lit === side;
    const dim = lit !== null && !on;
    return (
      <figure className="relative z-[1] m-0 flex flex-col items-center">
        <div className={`photo-frame transition-[filter,transform] duration-150 ${on && !spinning ? "scale-105" : ""}`}
          style={{ filter: dim ? "grayscale(0.9) brightness(0.45)" : on ? `drop-shadow(0 0 22px var(--color-${TONE[side]}))` : undefined }}>
          <IdolPhoto idolId={idolId} size={256} className="w-28 sm:w-40" />
        </div>
        <figcaption className={`mt-3 max-w-40 truncate font-display text-lg uppercase transition-colors ${dim ? "text-text-secondary" : `text-${TONE[side]}`}`}>{name}</figcaption>
      </figure>
    );
  };
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative isolate w-full max-w-xl overflow-hidden rounded-card px-4 pt-6 pb-5"
        style={{ background: "radial-gradient(70% 60% at 50% 110%, rgb(125 0 24 / 0.35), transparent 70%), linear-gradient(180deg, var(--color-bg-raised), var(--color-bg-base))" }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -z-10 w-1/2 transition-[left,opacity] duration-150 ease-out"
          style={{ left: lit === "B" ? "50%" : "0%", opacity: lit ? 1 : 0, background: `radial-gradient(55% 95% at 50% -12%, color-mix(in oklab, var(--color-${TONE[lit ?? "A"]}) 45%, transparent), transparent 72%)` }} />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          {portrait("A", idolA, a.name)}
          <div aria-hidden="true" className="flex flex-col items-center">
            <span className="kicker text-text-secondary">Game {Math.min(games.length + (spinning ? 0 : 1), bestOf)}</span>
            <span className={`font-gothic text-[3.5rem] leading-none text-brand-gold ${spinning && !reducedMotion() ? "animate-pulse" : ""}`}>vs</span>
          </div>
          {portrait("B", idolB, b.name)}
        </div>
        <ol aria-label="Result of each spin" className="m-0 mt-5 flex list-none justify-center gap-1.5 p-0">
          {Array.from({ length: bestOf }, (_, i) => {
            const g = games[i];
            return <li key={i} className={`h-1.5 w-8 ${g === "A" ? "bg-accent-bright" : g === "B" ? "bg-cool" : "bg-surface-hover"}`}>
              <span className="sr-only">{g ? `G${i + 1} ${g === "A" ? a.name : b.name}` : `G${i + 1} not played`}</span>
            </li>;
          })}
        </ol>
      </div>
      <p className="m-0 text-center font-display text-[3rem] leading-none tabular-nums" aria-live="polite">
        {scoreA}–{scoreB}
        {result && <span className="mt-2 block text-center text-lg uppercase text-brand-gold">{seriesWinner ? `${seriesWinner} wins` : "Draw"}</span>}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" disabled={!!result || busy} onClick={spin}>Spin game {games.length + 1}</Button>
        <Button disabled={!!result || busy} onClick={() => setAuto(true)}>Spin all</Button>
        <Button disabled={games.length === 0 || busy} onClick={() => { setLit(null); onChange([]); }}>Reset</Button>
      </div>
    </div>
  );
}
