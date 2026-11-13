// Replays a series game by game (PRD §9): a dominance bar moves, game scores appear in order,
// comebacks are highlighted. Skippable; with prefers-reduced-motion it shows the final score at once.
import type { Side } from "@sabung/engine";
import { useEffect, useState } from "react";
import { Button } from "./Button";

const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// The winner was behind at some point during the series.
export function isComeback(games: Side[]): boolean {
  const final = { A: 0, B: 0 };
  for (const g of games) final[g]++;
  const won = final.A > final.B ? "A" : final.B > final.A ? "B" : null;
  if (!won) return false; // a draw has no comeback
  const lost = won === "A" ? "B" : "A";
  const running = { A: 0, B: 0 };
  return games.some((g) => {
    running[g]++;
    return running[lost] > running[won];
  });
}

export function LiveMatchVisualizer({ games, nameA, nameB, stepMs = 700, onDone }: {
  games: Side[];
  nameA: string;
  nameB: string;
  stepMs?: number;
  onDone?: () => void;
}) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? games.length : 0));
  const done = shown >= games.length;

  useEffect(() => {
    if (done) {
      onDone?.();
      return;
    }
    const timer = setTimeout(() => setShown((n) => n + 1), stepMs);
    return () => clearTimeout(timer);
  }, [done, shown, stepMs, onDone]);

  const played = games.slice(0, shown);
  const scoreA = played.filter((g) => g === "A").length;
  const scoreB = played.length - scoreA;
  const shareA = played.length ? scoreA / played.length : 0.5;

  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-2xl tabular-nums" aria-live="polite">
        <span><span className="sr-only">{nameA} </span>{scoreA}</span>
        <span className="text-sm text-text-secondary">Game {Math.min(shown, games.length)} / {games.length}</span>
        <span><span className="sr-only">{nameB} </span>{scoreB}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cool" aria-hidden="true">
        <div
          className="h-full origin-left bg-accent-bright transition-transform duration-[var(--duration-slow)] ease-spring"
          style={{ transform: `scaleX(${shareA})` }}
        />
      </div>
      <ol className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0" aria-label="Pemenang tiap game">
        {played.map((g, i) => (
          <li key={i} className={`${g === "A" ? "text-accent-bright" : "text-cool"} rounded-control bg-surface-hover/60 px-2 py-0.5 text-xs`}>
            G{i + 1} · {g === "A" ? nameA : nameB}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-2">
        {done && isComeback(games) && <span className="rounded-control bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">Comeback!</span>}
        {!done && <Button className="px-2 py-1" onClick={() => setShown(games.length)}>Lewati</Button>}
      </div>
    </div>
  );
}
