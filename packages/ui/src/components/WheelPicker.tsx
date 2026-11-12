// A 50:50 wheel between two idols (PRD §9), spun once per game until the series is over.
// "Spin all" plays the rest at once. The result is only kept when MatchModal's Accept is pressed.
import { type Side, seriesState } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { IdolPhoto } from "./IdolPhoto";
import { useIdol } from "./idolSource";

export const SPIN_MS = 900;
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const { scoreA, scoreB, result } = seriesState(bestOf, games);

  const spin = () => {
    const winner: Side = random() < 0.5 ? "A" : "B";
    // The pointer is at the top; A is the right half (0–180°), B the left. Land in the middle of the winner's half.
    const landing = winner === "A" ? 90 : 270;
    setRotation((r) => Math.ceil(r / 360) * 360 + 1080 + (360 - landing));
    const wait = reducedMotion() ? 0 : SPIN_MS;
    setSpinning(true);
    timer.current = setTimeout(() => {
      setSpinning(false);
      onChange([...games, winner]);
    }, wait);
  };

  const spinAll = () => {
    const rest = [...games];
    while (!seriesState(bestOf, rest).result) rest.push(random() < 0.5 ? "A" : "B");
    onChange(rest);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <figure className="m-0 text-center">
          <IdolPhoto idolId={idolA} size={256} className="w-20" />
          <figcaption className="mt-1 text-sm text-accent-bright">{a.name}</figcaption>
        </figure>
        <div className="relative size-40">
          <div aria-hidden="true" className="absolute -top-1 left-1/2 z-10 h-0 w-0 -translate-x-1/2 border-x-8 border-t-[12px] border-x-transparent border-t-text-primary" />
          <div
            aria-hidden="true"
            className="size-full rounded-full border-2 border-border-strong"
            style={{
              background: "conic-gradient(var(--color-accent-bright) 0 180deg, var(--color-cool) 180deg 360deg)",
              transform: `rotate(${rotation}deg)`,
              transition: reducedMotion() ? "none" : `transform ${SPIN_MS}ms var(--ease-spring)`,
            }}
          />
        </div>
        <figure className="m-0 text-center">
          <IdolPhoto idolId={idolB} size={256} className="w-20" />
          <figcaption className="mt-1 text-sm text-cool">{b.name}</figcaption>
        </figure>
      </div>
      <p className="m-0 font-mono text-2xl tabular-nums" aria-live="polite">
        {scoreA}–{scoreB}
        {result && <span className="ml-2 font-sans text-sm text-text-secondary">{result === "D" ? "Seri" : `${result === "A" ? a.name : b.name} menang`}</span>}
      </p>
      <div className="flex gap-2">
        <Button variant="primary" disabled={!!result || spinning} onClick={spin}>Spin game {games.length + 1}</Button>
        <Button disabled={!!result || spinning} onClick={spinAll}>Spin all</Button>
        <Button disabled={games.length === 0 || spinning} onClick={() => onChange([])}>Ulang</Button>
      </div>
    </div>
  );
}
