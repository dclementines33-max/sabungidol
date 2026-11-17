// The 3D marble race on the whole screen (lazy-loaded: three + Rapier only load when a race opens). It starts the race,
// draws the overlay from the race's snapshots and offers speed, camera, skip and leave. `actions` = the buttons on the
// result card. Speed and camera start from the Marble Race panel's defaults.
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useArenaSettings } from "../../data/arenaSettings";
import { type Race, type RaceOptions, type RaceSnapshot, createRace } from "../../marble/controller";
import { RaceHud } from "./RaceHud";
import { RaceResult } from "./RaceResult";
import "./marble.css";

const BTN = "-skew-x-12 cursor-pointer bg-stage-hi/95 px-3 py-2 text-xs font-extrabold tracking-[0.1em] uppercase hover:text-text-primary aria-pressed:bg-accent aria-pressed:text-on-accent focus-visible:outline-2 focus-visible:outline-accent-bright [&>span]:inline-block [&>span]:skew-x-12";

export default function MarbleStage({ options, title, actions, onLeave }: { options: RaceOptions; title: string; actions: (s: RaceSnapshot) => ReactNode; onLeave: () => void }) {
  const view = useRef<HTMLDivElement>(null);
  const tags = useRef<HTMLDivElement>(null);
  const race = useRef<Race | null>(null);
  const setup = useArenaSettings((s) => s.setup);
  const [snap, setSnap] = useState<RaceSnapshot | null>(null);
  const [speed, setSpeed] = useState(setup.speed);
  const [camera, setCamera] = useState(setup.camera);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // every start gets its own canvas: a race that is thrown away frees its WebGL context without touching the next one
    let live = true;
    const canvas = Object.assign(document.createElement("canvas"), { className: "absolute inset-0 size-full" });
    canvas.setAttribute("aria-label", `Marble race · ${title}`);
    view.current!.append(canvas);
    createRace({ canvas, tags: tags.current!, quality: setup.quality, onUpdate: (s) => { if (live) setSnap(s); } })
      .then((r) => { if (!live) return r.dispose(); race.current = r; r.setSpeed(speed); r.setCamera(camera); r.start(options); })
      .catch((e: unknown) => setFailed(e instanceof Error ? e.message : String(e)));
    return () => { live = false; race.current?.dispose(); race.current = null; canvas.remove(); };
    // a new attempt (after the graphics card reset the view) builds everything again
  }, [attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSpeed = (v: 1 | 2 | 4) => { setSpeed(v); race.current?.setSpeed(v); };
  const onCamera = (v: "tv" | "chase" | "free") => { setCamera(v); race.current?.setCamera(v); };
  const running = snap && snap.phase !== "finished" && snap.phase !== "idle";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-bg-base text-text-primary">
      <div ref={view} className="absolute inset-0" />
      <div ref={tags} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      {snap && <RaceHud s={snap} players={options.players} title={title} onFollow={(k) => race.current?.follow(k)} />}

      <div role="group" aria-label="Race controls" className="absolute right-2 bottom-3 left-2 flex flex-wrap justify-end gap-1 sm:right-5 sm:left-auto">
        {([1, 2, 4] as const).map((x) => <button key={x} type="button" aria-pressed={speed === x} className={BTN} onClick={() => onSpeed(x)}><span>{x}×</span></button>)}
        {(["tv", "chase", "free"] as const).map((c) => <button key={c} type="button" aria-pressed={camera === c} className={BTN} onClick={() => onCamera(c)}><span>{c === "tv" ? "TV" : c}</span></button>)}
        <button type="button" className={BTN} disabled={!running} onClick={() => race.current?.skipGame()}><span>Skip game</span></button>
        <button type="button" className={BTN} disabled={!running} onClick={() => race.current?.skipMatch()}><span>Skip match</span></button>
        <button type="button" className={BTN} onClick={onLeave}><span>Leave</span></button>
      </div>

      {!snap && !failed && <p className="score absolute inset-0 m-0 grid place-items-center text-xl">Loading the arena…</p>}
      {(failed || snap?.lost) && (
        <div className="absolute inset-0 grid place-items-center bg-bg-base/90 p-6 text-center">
          <div>
            <p className="m-0 text-lg">{failed ? `The 3D view couldn't start: ${failed}` : "The graphics card reset the 3D view."}</p>
            <button type="button" className={`${BTN} mt-4 bg-accent text-on-accent`} onClick={() => { setFailed(null); setSnap(null); setAttempt((n) => n + 1); }}><span>Start again</span></button>
          </div>
        </div>
      )}
      {snap?.phase === "finished" && <RaceResult s={snap} players={options.players} actions={actions(snap)} />}
    </div>
  );
}
