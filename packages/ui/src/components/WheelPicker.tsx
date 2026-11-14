// A 50:50 prize wheel between two idols (PRD §9; Update 3: blinking rim lights, the spin winner lights up): 12 segments alternating A and B, pegs on the rim, a
// pointer that ticks while it turns and a long slow-down. One spin = one game. "Spin all" keeps
// spinning, one game at a time, until the series is over (Bo3 at most 3 spins, Bo5 at most 5 …).
// The result is only kept when MatchModal's Accept is pressed.
import { type Side, seriesState } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { IdolPhoto } from "./IdolPhoto";
import { useIdol } from "./idolSource";

export const SPIN_MS = 2600;
export const PAUSE_MS = 500; // between the spins of "Spin all"
const SEGMENTS = 12;
const STEP = 360 / SEGMENTS;
const R = 100;
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const point = (deg: number, r: number) => [R + r * Math.sin((deg * Math.PI) / 180), R - r * Math.cos((deg * Math.PI) / 180)] as const;

// One random number picks the side (below 0.5 = A) and where inside one of its six segments the pointer stops.
function landing(r: number): { winner: Side; angle: number } {
  const winner: Side = r < 0.5 ? "A" : "B";
  const x = (winner === "A" ? r * 2 : (r - 0.5) * 2) * (SEGMENTS / 2);
  const k = Math.min(Math.floor(x), SEGMENTS / 2 - 1);
  const segment = k * 2 + (winner === "A" ? 0 : 1); // even segments are A
  return { winner, angle: (segment + 0.2 + 0.6 * (x - k)) * STEP };
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
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [auto, setAuto] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined); // the pause before the next "Spin all" spin
  const stop = useRef<ReturnType<typeof setTimeout>>(undefined); // the wheel stopping; its own timer, or the pause clean-up cancels it
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(stop.current); }, []);
  const { scoreA, scoreB, result } = seriesState(bestOf, games);

  const spin = () => {
    const { winner, angle } = landing(random());
    setRotation((r) => Math.ceil(r / 360) * 360 + 5 * 360 + (360 - angle)); // the pointer (top) reads wheel angle -rotation
    setSpinning(true);
    stop.current = setTimeout(() => {
      setSpinning(false);
      onChange([...games, winner]);
    }, reducedMotion() ? 0 : SPIN_MS);
  };

  // "Spin all": after each stop, wait a moment and spin again while the series is still open.
  useEffect(() => {
    if (!auto || spinning) return;
    if (result) { setAuto(false); return; }
    timer.current = setTimeout(spin, games.length === 0 || reducedMotion() ? 0 : PAUSE_MS);
    return () => clearTimeout(timer.current);
  }, [auto, spinning, games.length, result]); // eslint-disable-line react-hooks/exhaustive-deps


  const busy = spinning || auto;
  const last = !spinning ? games.at(-1) : undefined; // the side that just won a spin lights up
  const seriesWinner = result && result !== "D" ? (result === "A" ? a.name : b.name) : null;
  const photo = (side: Side, idolId: string, name: string, tone: string) => (
    <figure className="m-0 text-center">
      <div key={`${side}${games.length}`} className={`transition-transform duration-300 ${last === side ? "scale-110 animate-[wheel-win_700ms_ease-out]" : ""}`}
        style={{ filter: last === side ? `drop-shadow(0 0 18px var(--color-${tone}))` : undefined }}>
        <IdolPhoto idolId={idolId} size={256} className="w-20 sm:w-28" />
      </div>
      <figcaption className={`mt-2 max-w-28 truncate font-display text-sm uppercase text-${tone}`}>{name}</figcaption>
    </figure>
  );
  return (
    <div className="flex flex-col items-center gap-5">
      <style>{"@keyframes wheel-tick{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}@keyframes wheel-bulb{0%,100%{opacity:1}50%{opacity:.25}}@keyframes wheel-win{0%{transform:scale(1)}40%{transform:scale(1.22)}100%{transform:scale(1.1)}}"}</style>
      <div className="flex items-center gap-3 sm:gap-8">
        {photo("A", idolA, a.name, "accent-bright")}
        <div className="relative size-64 sm:size-80">
          <div aria-hidden="true" className="absolute -inset-4 rounded-full blur-2xl transition-opacity duration-500"
            style={{ background: "conic-gradient(from 0deg, var(--color-accent-bright), var(--color-cool), var(--color-accent-bright))", opacity: spinning ? 0.45 : 0.18 }} />
          <svg aria-hidden="true" viewBox="0 0 200 200" className="relative size-full"
            style={{ transform: `rotate(${rotation}deg)`, transition: reducedMotion() ? "none" : `transform ${SPIN_MS}ms cubic-bezier(0.1, 0.75, 0.15, 1)` }}>
            <circle cx={R} cy={R} r={R} fill="var(--color-surface)" />
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const [x1, y1] = point(i * STEP, R - 8);
              const [x2, y2] = point((i + 1) * STEP, R - 8);
              const [tx, ty] = point((i + 0.5) * STEP, R - 32);
              const side = i % 2 === 0 ? a : b;
              return (
                <g key={i}>
                  <path d={`M${R},${R} L${x1},${y1} A${R - 8},${R - 8} 0 0 1 ${x2},${y2} Z`} fill={i % 2 === 0 ? "var(--color-accent-bright)" : "var(--color-cool)"}
                    opacity={i % 4 < 2 ? 1 : 0.8} stroke="var(--color-bg-base)" strokeWidth="1.2" />
                  <text x={tx} y={ty} transform={`rotate(${(i + 0.5) * STEP} ${tx} ${ty})`} textAnchor="middle" dominantBaseline="middle"
                    fontSize="15" fontWeight="800" fill="var(--color-bg-base)">{side.name.slice(0, 1).toUpperCase()}</text>
                </g>
              );
            })}
            {Array.from({ length: SEGMENTS * 2 }, (_, i) => {
              const [x, y] = point(i * (STEP / 2), R - 4);
              return <circle key={i} cx={x} cy={y} r="2.4" fill={i % 2 ? "var(--color-brand-gold)" : "var(--color-text-primary)"}
                style={{ animation: spinning && !reducedMotion() ? `wheel-bulb 300ms ${i % 2 ? 150 : 0}ms infinite` : "none" }} />;
            })}
            <circle cx={R} cy={R} r="26" fill="var(--color-bg-base)" stroke="var(--color-brand-gold)" strokeWidth="3" />
          </svg>
          <span aria-hidden="true" className="absolute inset-0 m-auto flex size-12 items-center justify-center font-gothic text-2xl text-brand-gold">G{Math.min(games.length + (spinning ? 0 : 1), bestOf)}</span>
          <svg aria-hidden="true" viewBox="0 0 24 30" className="absolute -top-4 left-1/2 z-10 w-7 -translate-x-1/2 origin-[50%_20%] drop-shadow-[0_0_8px_var(--color-brand-gold)]"
            style={{ animation: spinning && !reducedMotion() ? "wheel-tick 110ms linear infinite" : "none" }}>
            <path d="M12 30 L2 6 A10 10 0 1 1 22 6 Z" fill="var(--color-brand-gold)" stroke="var(--color-bg-base)" strokeWidth="2" />
          </svg>
        </div>
        {photo("B", idolB, b.name, "cool")}
      </div>
      {games.length > 0 && (
        <ol aria-label="Result of each spin" className="m-0 flex list-none flex-wrap justify-center gap-1 p-0 font-mono text-xs">
          {games.map((g, i) => <li key={i} className={`px-2 py-0.5 ${g === "A" ? "bg-accent/60" : "bg-surface-hover"}`}>G{i + 1} {g === "A" ? a.name : b.name}</li>)}
        </ol>
      )}
      <p className="m-0 text-center font-display text-5xl leading-none tabular-nums" aria-live="polite">
        {scoreA}–{scoreB}
        {result && <span className="mt-2 block text-center text-lg uppercase text-brand-gold">{seriesWinner ? `${seriesWinner} wins` : "Draw"}</span>}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" disabled={!!result || busy} onClick={spin}>Spin game {games.length + 1}</Button>
        <Button disabled={!!result || busy} onClick={() => setAuto(true)}>Spin all</Button>
        <Button disabled={games.length === 0 || busy} onClick={() => onChange([])}>Reset</Button>
      </div>
    </div>
  );
}
