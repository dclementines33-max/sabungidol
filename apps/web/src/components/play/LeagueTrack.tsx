// A league's Simulation Timeline as a live broadcast (2026-11-17, user): the sideways timeline on top and the league's
// standings under it (the Timing tower), both on one clock (broadcast.ts): a matchday every DAY_MS, longer on a matchday
// with a story, then the finale. Cards ahead of the clock show only their label (no spoilers) until reached, or until the
// timeline is touched (that also stops the clock); Next steps by hand; Skip jumps to the end. With prefers-reduced-motion
// nothing moves by itself.
import type { Timeline } from "@sabung/engine";
import { Button, IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { arenaOf } from "../competition/arenaTheme";
import { TimingTower, tower } from "../progression/TimingTower";
import { broadcastFrames } from "./broadcast";
import { TimelineFinale } from "./TimelineFinale";
import { headlineOf, kickerOf, pointLabel, starOf, toneOf } from "./timelineText";

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function LeagueTrack({ t }: { t: Timeline }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "league", t.track!], queryFn: () => engine().leagueView(t.track!), enabled: typeof Worker !== "undefined" });
  const lastDay = view ? Math.max(0, ...Object.values(view.positions).map((p) => p.length)) : 0;
  const frames = useMemo(() => broadcastFrames(t.points, !!t.finale, lastDay), [t, lastDay]);
  const list = useRef<HTMLOListElement>(null);
  const [f, setF] = useState(0);
  const [auto, setAuto] = useState(!reducedMotion());
  const [touched, setTouched] = useState(false);
  const frame = frames[Math.min(f, frames.length - 1)]!;
  const end = f >= frames.length - 1;
  useEffect(() => {
    if (!auto || end) return;
    const timer = setTimeout(() => setF(f + 1), frame.ms);
    return () => clearTimeout(timer);
  }, [auto, end, f, frame.ms]);
  useEffect(() => {
    const ol = list.current;
    const card = ol?.children[frame.at] as HTMLElement | undefined;
    if (ol && card) ol.scrollTo?.({ left: card.offsetLeft - ol.offsetLeft, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [frame.at]);
  const stop = () => setAuto(false);
  const touch = () => { stop(); setTouched(true); };
  const shown = (i: number) => i <= frame.at || touched;
  return (
    <div data-arena={arenaOf(t.track!)} className="min-w-0 space-y-5">
      <ol ref={list} tabIndex={0} aria-label="Timeline" onPointerDown={touch} onWheel={touch} onKeyDown={touch}
        className="m-0 flex min-w-0 snap-x snap-mandatory list-none gap-4 overflow-x-auto p-0 pb-3 focus-visible:outline-2 focus-visible:outline-accent-bright">
        {t.points.map((p, i) => (
          <li key={`${p.comp}${p.stage}${p.round}`} aria-current={i === frame.at ? "step" : undefined} className={`panel flex w-[min(18rem,78vw)] shrink-0 snap-start flex-col p-4 transition-shadow ${i === frame.at ? "shadow-[0_0_0_1px_var(--color-accent-bright),0_0_44px_-14px_var(--color-accent-bright)]" : ""} ${shown(i) ? "" : "text-text-secondary"}`}>
            <p className="m-0 flex items-center gap-2">
              <span aria-hidden="true" className={`size-2.5 shrink-0 rotate-45 ${i <= frame.at ? "bg-accent-bright shadow-[0_0_10px_var(--color-accent-bright)]" : "bg-surface-hover"}`} />
              <span className="kicker no-slash">{pointLabel(p, label, false)}</span>
            </p>
            {shown(i) && <ul className="m-0 mt-3 flex max-h-64 list-none flex-col gap-3 overflow-y-auto p-0">
              {p.stories.map((s, j) => (
                <li key={j} className="flex items-start gap-3">
                  <IdolPhoto idolId={starOf(s)} size={256} className="photo-frame w-14 shrink-0" />
                  <span className="min-w-0">
                    <span lang="id" className="block text-xs font-bold tracking-[0.2em] uppercase" style={{ color: toneOf(s) }}>{kickerOf(s)}</span>
                    <span lang="id" className="block font-display text-base leading-tight">{headlineOf(s, name, label)}</span>
                  </span>
                </li>
              ))}
            </ul>}
          </li>
        ))}
        {t.finale && (
          <li aria-current={frame.at === t.points.length ? "step" : undefined} className="stage w-[min(20rem,82vw)] shrink-0 snap-start rounded-card p-4 shadow-[inset_0_3px_0_var(--color-winner)]">
            {shown(t.points.length) ? <TimelineFinale finale={t.finale} name={name} label={label} /> : <p className="kicker m-0">Finale</p>}
          </li>
        )}
      </ol>
      {!end && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { stop(); setF(f + 1); }}>Next</Button>
          <Button onClick={() => { stop(); setF(frames.length - 1); }}>Skip to the end</Button>
        </div>
      )}
      <section aria-label="Live standings" className="space-y-2">
        <p className="m-0 flex items-center gap-3">
          <span className="chip bg-accent-bright text-on-fill"><span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-1.5 rounded-full bg-on-fill motion-safe:animate-pulse" />Live</span></span>
          <span className="kicker">{label(t.track!)} · after matchday {frame.day}{lastDay ? ` / ${lastDay}` : ""}</span>
        </p>
        {view && frame.day > 0 ? (
          <TimingTower label={`Standings after matchday ${frame.day}`} rows={tower(view, frame.day)} />
        ) : <p className="m-0 text-sm text-text-secondary">Loading the standings…</p>}
      </section>
    </div>
  );
}
