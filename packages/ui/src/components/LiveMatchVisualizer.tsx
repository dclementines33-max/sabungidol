// Replays a series game by game (PRD §9; Update 3): each game is a short tug of war before its winner shows,
// the score grows, "Match point" when one more game decides it. The number of games is never shown before
// the end, so the final score stays a surprise. Skippable; with prefers-reduced-motion it ends at once.
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

export function LiveMatchVisualizer({ games, nameA, nameB, target, stepMs = 1400, onDone }: {
  games: Side[];
  nameA: string;
  nameB: string;
  target?: number; // games needed to win (Bo5 = 3): enables "Match point"
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
  const matchPoint = !done && !!target && (scoreA === target - 1 || scoreB === target - 1);
  const winner = done ? (scoreA > scoreB ? nameA : scoreB > scoreA ? nameB : null) : null;

  return (
    <div className="relative">
      <style>{"@keyframes tug{0%,100%{transform:translateX(-18%)}25%{transform:translateX(14%)}50%{transform:translateX(-8%)}75%{transform:translateX(22%)}}@keyframes pop{0%{transform:scale(1.6);opacity:0}100%{transform:scale(1);opacity:1}}"}</style>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4" aria-live="polite">
        <span className="truncate text-right font-display text-lg text-accent-bright">{nameA}</span>
        <span className="flex items-baseline gap-3 font-display text-6xl leading-none tabular-nums">
          <span key={`a${scoreA}`} className="animate-[pop_400ms_ease-out]"><span className="sr-only">{nameA} </span>{scoreA}</span>
          <span className="text-2xl text-text-secondary">–</span>
          <span key={`b${scoreB}`} className="animate-[pop_400ms_ease-out]"><span className="sr-only">{nameB} </span>{scoreB}</span>
        </span>
        <span className="truncate font-display text-lg text-cool">{nameB}</span>
      </div>
      <p className="m-0 mt-2 text-center text-xs font-bold tracking-[0.3em] text-text-secondary uppercase">
        {done ? "Full time" : `Game ${shown + 1} in play`}
        {matchPoint && <span className="ml-2 bg-accent px-2 py-0.5 tracking-widest text-on-accent">Match point</span>}
      </p>
      <div className="relative mt-3 h-3 overflow-hidden bg-cool" aria-hidden="true">
        <div className="h-full origin-left bg-accent-bright transition-transform duration-[var(--duration-slow)] ease-spring" style={{ transform: `scaleX(${shareA})` }} />
        {!done && <span className="absolute inset-y-0 left-1/2 w-1 bg-text-primary shadow-[0_0_12px_var(--color-text-primary)] animate-[tug_900ms_ease-in-out_infinite]" />}
      </div>
      <ol className="m-0 mt-3 flex list-none flex-wrap justify-center gap-2 p-0" aria-label="Winner of each game">
        {played.map((g, i) => (
          <li key={i} className={`${g === "A" ? "bg-accent/60" : "bg-surface-hover"} animate-[pop_300ms_ease-out] px-2 py-0.5 text-xs`}>
            G{i + 1} · {g === "A" ? nameA : nameB}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex min-h-8 items-center justify-center gap-2">
        {done && <span className="font-display text-xl uppercase">{winner ? `${winner} wins` : "Draw"}</span>}
        {done && isComeback(games) && <span className="bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">Comeback!</span>}
        {!done && <Button className="px-2 py-1" onClick={() => setShown(games.length)}>Skip</Button>}
      </div>
    </div>
  );
}
