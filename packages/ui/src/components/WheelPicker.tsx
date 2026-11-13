// A 50:50 prize wheel between two idols (PRD §9): 12 segments alternating A and B, pegs on the rim, a
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
  return (
    <div className="flex flex-col items-center gap-4">
      <style>{"@keyframes wheel-tick{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}"}</style>
      <div className="flex items-center gap-3 sm:gap-6">
        <figure className="m-0 text-center">
          <IdolPhoto idolId={idolA} size={256} className="w-16 sm:w-20" />
          <figcaption className="mt-1 max-w-20 truncate text-sm text-accent-bright">{a.name}</figcaption>
        </figure>
        <div className="relative size-52 sm:size-64">
          <svg aria-hidden="true" viewBox="0 0 200 200" className="size-full drop-shadow-lg"
            style={{ transform: `rotate(${rotation}deg)`, transition: reducedMotion() ? "none" : `transform ${SPIN_MS}ms cubic-bezier(0.1, 0.75, 0.15, 1)` }}>
            <circle cx={R} cy={R} r={R} fill="var(--color-border-strong)" />
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const [x1, y1] = point(i * STEP, R - 6);
              const [x2, y2] = point((i + 1) * STEP, R - 6);
              const [tx, ty] = point((i + 0.5) * STEP, R - 30);
              const side = i % 2 === 0 ? a : b;
              return (
                <g key={i}>
                  <path d={`M${R},${R} L${x1},${y1} A${R - 6},${R - 6} 0 0 1 ${x2},${y2} Z`} fill={i % 2 === 0 ? "var(--color-accent-bright)" : "var(--color-cool)"}
                    opacity={i % 4 < 2 ? 1 : 0.82} stroke="var(--color-bg)" strokeWidth="1" />
                  <text x={tx} y={ty} transform={`rotate(${(i + 0.5) * STEP} ${tx} ${ty})`} textAnchor="middle" dominantBaseline="middle"
                    fontSize="15" fontWeight="700" fill="var(--color-bg)">{side.name.slice(0, 1).toUpperCase()}</text>
                </g>
              );
            })}
            {Array.from({ length: SEGMENTS }, (_, i) => { const [x, y] = point(i * STEP, R - 3); return <circle key={i} cx={x} cy={y} r="2.2" fill="var(--color-text-primary)" />; })}
            <circle cx={R} cy={R} r="22" fill="var(--color-bg-raised)" stroke="var(--color-border-strong)" strokeWidth="3" />
          </svg>
          <span aria-hidden="true" className="absolute inset-0 m-auto flex size-11 items-center justify-center font-mono text-sm text-text-primary">G{Math.min(games.length + (spinning ? 0 : 1), bestOf)}</span>
          <svg aria-hidden="true" viewBox="0 0 24 30" className="absolute -top-3 left-1/2 z-10 w-6 -translate-x-1/2 origin-[50%_20%]"
            style={{ animation: spinning && !reducedMotion() ? "wheel-tick 110ms linear infinite" : "none" }}>
            <path d="M12 30 L2 6 A10 10 0 1 1 22 6 Z" fill="var(--color-text-primary)" stroke="var(--color-bg)" strokeWidth="2" />
          </svg>
        </div>
        <figure className="m-0 text-center">
          <IdolPhoto idolId={idolB} size={256} className="w-16 sm:w-20" />
          <figcaption className="mt-1 max-w-20 truncate text-sm text-cool">{b.name}</figcaption>
        </figure>
      </div>
      {games.length > 0 && (
        <ol aria-label="Hasil tiap spin" className="m-0 flex list-none flex-wrap justify-center gap-1 p-0 font-mono text-xs">
          {games.map((g, i) => <li key={i} className={`rounded-control bg-surface-hover/60 px-2 py-0.5 ${g === "A" ? "text-accent-bright" : "text-cool"}`}>G{i + 1} {g === "A" ? a.name : b.name}</li>)}
        </ol>
      )}
      <p className="m-0 font-mono text-2xl tabular-nums" aria-live="polite">
        {scoreA}–{scoreB}
        {result && <span className="ml-2 font-sans text-sm text-text-secondary">{result === "D" ? "Seri" : `${result === "A" ? a.name : b.name} menang`}</span>}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" disabled={!!result || busy} onClick={spin}>Spin game {games.length + 1}</Button>
        <Button disabled={!!result || busy} onClick={() => setAuto(true)}>Spin all</Button>
        <Button disabled={games.length === 0 || busy} onClick={() => onChange([])}>Ulang</Button>
      </div>
    </div>
  );
}
