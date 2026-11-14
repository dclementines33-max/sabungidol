// How a match is played (2026-11-15: the wheel is back, now the only way to play): a cinematic stage — the two idols framed
// left and right in a spotlight, the wheel between them. Each spin = one game; after it the winner is lit (a gallery photo
// flashes up when she has one) and the loser greys out. Match point and the deciding game get a longer spin and a call
// on the stage; a crowd meter and the live series chance follow the score; the score flips like a stadium board; an upset
// (10+ rating gap) gets a stamp and a final gets gold and a burst. Fair: wheelMath.landing, one draw per game, 50:50.
import { type Side, seriesState } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { IdolPhoto } from "./IdolPhoto";
import { useGalleryPhoto, useIdol } from "./idolSource";
import { WheelDisc } from "./WheelDisc";
import { PAUSE_MS, crowd, isUpset, landing, seriesChance, spinMs, tension } from "./wheelMath";

export { PAUSE_MS, SPIN_MS, TENSE_MS } from "./wheelMath";
const TONE: Record<Side, string> = { A: "accent-bright", B: "cool" };
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const KEYFRAMES = "@keyframes wheel-tick{0%,100%{transform:translateX(-50%) rotate(0)}50%{transform:translateX(-50%) rotate(-16deg)}}@keyframes flap{from{transform:rotateX(90deg);opacity:.2}to{transform:rotateX(0);opacity:1}}@keyframes stamp{from{transform:scale(2.4) rotate(-14deg);opacity:0}to{transform:scale(1) rotate(-14deg);opacity:1}}@keyframes burst{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--x),var(--y)) scale(.3);opacity:0}}";

function GalleryShot({ photoId, className }: { photoId: string; className: string }) {
  const src = useGalleryPhoto(photoId, 256);
  return src ? <img src={src} alt="" className={`${className} aspect-[3/4] object-cover`} /> : null;
}

function Portrait({ side, idolId, lit, dim, shot, stamp }: { side: Side; idolId: string; lit: boolean; dim: boolean; shot?: string; stamp: boolean }) {
  const idol = useIdol(idolId);
  return (
    <figure className="relative z-[1] m-0 flex flex-col items-center">
      <div className={`photo-frame transition-[filter,transform] duration-300 ${lit ? "scale-105" : ""}`}
        style={{ filter: dim ? "grayscale(0.95) brightness(0.4)" : lit ? `drop-shadow(0 0 26px var(--color-${TONE[side]}))` : undefined }}>
        {lit && shot ? <GalleryShot photoId={shot} className="w-24 sm:w-36" /> : <IdolPhoto idolId={idolId} size={256} className="w-24 sm:w-36" />}
      </div>
      {stamp && <span className="absolute top-1/3 bg-accent px-3 py-1 font-display text-2xl tracking-widest text-on-accent uppercase shadow-lg [animation:stamp_450ms_cubic-bezier(.2,1.6,.4,1)_both]">Upset</span>}
      <figcaption className={`mt-3 max-w-36 truncate font-display text-lg uppercase transition-colors ${dim ? "text-text-secondary" : `text-${TONE[side]}`}`}>{idol.name}</figcaption>
      <span className="font-mono text-xs text-text-secondary">{idol.rating}</span>
    </figure>
  );
}

function Flap({ value }: { value: number }) {
  return <span key={value} className="inline-block min-w-[1.1em] bg-surface px-2 py-1 [animation:flap_350ms_ease-out] [transform-origin:50%_100%]">{value}</span>;
}

export function WheelPicker({ idolA, idolB, bestOf, games, onChange, random = Math.random, grand = false }: {
  idolA: string;
  idolB: string;
  bestOf: BestOf;
  games: Side[];
  onChange: (games: Side[]) => void;
  random?: () => number;
  grand?: boolean; // a final: gold and a burst at the end
}) {
  const a = useIdol(idolA);
  const b = useIdol(idolB);
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [auto, setAuto] = useState(false);
  const [shot, setShot] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined); // the pause before the next "Spin all" spin
  const stop = useRef<ReturnType<typeof setTimeout>>(undefined); // the wheel stopping; its own timer, or the pause clean-up cancels it
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(stop.current); }, []);
  const { scoreA, scoreB, result } = seriesState(bestOf, games);
  const call = tension(bestOf, games);

  const spin = () => {
    const { winner, angle } = landing(random());
    const ms = reducedMotion() ? 0 : spinMs(bestOf, games);
    setDuration(ms);
    setRotation((r) => Math.ceil(r / 360) * 360 + (ms > 4000 ? 8 : 5) * 360 + (360 - angle)); // the pointer (top) reads wheel angle −rotation
    setSpinning(true);
    stop.current = setTimeout(() => {
      const pool = (winner === "A" ? a : b).gallery ?? [];
      setShot(pool.length ? pool[Math.floor(Math.random() * pool.length)] : undefined); // only the picture; the result is drawn above
      setSpinning(false);
      onChange([...games, winner]);
    }, ms);
  };

  // "Spin all": after each stop, a moment for the winner, then the next spin while the series is still open.
  useEffect(() => {
    if (!auto || spinning) return;
    if (result) { setAuto(false); return; }
    timer.current = setTimeout(spin, games.length === 0 || reducedMotion() ? 0 : PAUSE_MS);
    return () => clearTimeout(timer.current);
  }, [auto, spinning, games.length, result]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = spinning || auto;
  const last = !spinning ? games.at(-1) : undefined;
  const winnerSide: Side | null = result === "A" || result === "B" ? result : null;
  const lit = winnerSide ?? last ?? null;
  const upset = isUpset(result, a.rating, b.rating);
  const chance = seriesChance(bestOf, games);
  const noise = crowd(bestOf, games, a.rating, b.rating);
  return (
    <div className="flex flex-col items-center gap-4">
      <style>{KEYFRAMES}</style>
      <div className="relative isolate w-full overflow-hidden rounded-card px-3 pt-4 pb-5 sm:px-6"
        style={{ background: `radial-gradient(70% 55% at 50% 115%, ${grand ? "rgb(233 180 76 / 0.3)" : "rgb(125 0 24 / 0.4)"}, transparent 70%), linear-gradient(180deg, var(--color-bg-raised), var(--color-bg-base))` }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -z-10 w-1/2 transition-[left,opacity] duration-500"
          style={{ left: lit === "B" ? "50%" : "0%", opacity: lit ? 1 : 0, background: `radial-gradient(50% 90% at 50% -10%, color-mix(in oklab, var(--color-${TONE[lit ?? "A"]}) 40%, transparent), transparent 72%)` }} />
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">
          <span className={call ? "bg-accent px-2 py-0.5 text-on-accent animate-pulse" : "invisible"}>{call ?? "—"}</span>
          <span className="flex items-center gap-2">Crowd
            <span aria-hidden="true" className="h-1.5 w-24 bg-surface"><span className="block h-full bg-gradient-to-r from-brand-gold to-accent-bright transition-[width] duration-700" style={{ width: `${Math.round(noise * 100)}%` }} /></span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_minmax(0,15rem)_1fr] items-center gap-2 sm:grid-cols-[1fr_18rem_1fr] sm:gap-4">
          <Portrait side="A" idolId={idolA} lit={lit === "A"} dim={lit === "B"} shot={lit === "A" ? shot : undefined} stamp={upset && result === "A"} />
          <WheelDisc rotation={rotation} durationMs={duration} spinning={spinning && !reducedMotion()} grand={grand}
            label={`G${result ? games.length : games.length + 1}`} initials={[a.name.slice(0, 1).toUpperCase(), b.name.slice(0, 1).toUpperCase()]} />
          <Portrait side="B" idolId={idolB} lit={lit === "B"} dim={lit === "A"} shot={lit === "B" ? shot : undefined} stamp={upset && result === "B"} />
        </div>
        <div className="mx-auto mt-4 max-w-md">
          <p className="m-0 mb-1 flex justify-between font-mono text-[11px] text-text-secondary"><span>{Math.round(chance.A * 100)}%</span><span>Series chance</span><span>{Math.round(chance.B * 100)}%</span></p>
          <div aria-hidden="true" className="flex h-1.5 overflow-hidden bg-surface">
            <span className="bg-accent-bright transition-[width] duration-700" style={{ width: `${chance.A * 100}%` }} />
            <span className="bg-muted transition-[width] duration-700" style={{ width: `${chance.D * 100}%` }} />
            <span className="bg-cool transition-[width] duration-700" style={{ width: `${chance.B * 100}%` }} />
          </div>
          <ol aria-label="Result of each spin" className="m-0 mt-3 flex list-none justify-center gap-1.5 p-0">
            {Array.from({ length: bestOf }, (_, i) => (
              <li key={i} className={`h-1.5 w-8 ${games[i] === "A" ? "bg-accent-bright" : games[i] === "B" ? "bg-cool" : "bg-surface-hover"}`}>
                <span className="sr-only">{games[i] ? `G${i + 1} ${games[i] === "A" ? a.name : b.name}` : `G${i + 1} not played`}</span>
              </li>
            ))}
          </ol>
        </div>
        {grand && winnerSide && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className="absolute size-2 rounded-full bg-brand-gold [animation:burst_1100ms_ease-out_forwards]"
                style={{ "--x": `${Math.cos((i / 14) * 2 * Math.PI) * 180}px`, "--y": `${Math.sin((i / 14) * 2 * Math.PI) * 120}px` } as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>
      <p className="m-0 flex items-center gap-2 font-display text-[2.5rem] leading-none tabular-nums [perspective:400px]" aria-live="polite">
        <span className="sr-only">{scoreA}–{scoreB}</span>
        <span aria-hidden="true" className="flex items-center gap-2"><Flap value={scoreA} /><span className="text-text-secondary">–</span><Flap value={scoreB} /></span>
      </p>
      {result && <p className={`m-0 -mt-2 text-center font-display text-lg uppercase ${grand ? "text-brand-gold" : "text-text-primary"}`}>{winnerSide ? `${winnerSide === "A" ? a.name : b.name} wins` : "Draw"}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" disabled={!!result || busy} onClick={spin}>Spin game {games.length + 1}</Button>
        <Button disabled={!!result || busy} onClick={() => setAuto(true)}>Spin all</Button>
        <Button disabled={games.length === 0 || busy} onClick={() => { setShot(undefined); onChange([]); }}>Reset</Button>
      </div>
    </div>
  );
}
