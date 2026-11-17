// Play one match (PRD §9; 2026-11-15: Simulate is gone): the Wheel (WheelPicker.tsx), a preset score or a score set directly (Manual),
// or (2026-11-18) the Marble Race: the app passes `marble`, which renders that mode and hands back the race's games.
// Preset and Manual build their games with gamesForScore (alternating, winner last). Facts (season
// record, career…) sit under the header. Nothing is written until "Accept Result".
import { type Side, finalScores, gamesForScore, seriesState, seriesTarget } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { Minus, Plus } from "../icons";
import { type ReactNode, useState } from "react";
import { Button } from "./Button";
import { MatchGallery } from "./MatchGallery";
import { type HeadToHead, MatchHeader, type MatchTheme } from "./MatchHeader";
import { Modal } from "./Modal";
import { WheelPicker } from "./WheelPicker";
import { useIdol } from "./idolSource";

export type MatchMethod = "sim" | "manual" | "wheel" | "marble";
export type AcceptedResult = { method: MatchMethod; scoreA: number; scoreB: number; result: Side | "D"; games: Side[] };
export type MatchFact = { label: string; a: string; b: string };
type Mode = "wheel" | "preset" | "manual" | "marble";

const MODES: { mode: Mode; label: string }[] = [
  { mode: "wheel", label: "Wheel" },
  { mode: "preset", label: "Score presets" },
  { mode: "manual", label: "Manual" },
];
const CHIP = "-skew-x-12 rounded-[3px] px-4 py-1.5 text-xs font-bold tracking-[0.12em] uppercase focus-visible:outline-2 focus-visible:outline-accent-bright";

function Stepper({ name, value, max, onChange }: { name: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="max-w-32 truncate text-sm text-text-secondary">{name}</span>
      <div className="flex items-center gap-2">
        <Button aria-label={`Lower ${name}'s score`} className="p-2" disabled={value === 0} onClick={() => onChange(value - 1)}><Minus size={16} aria-hidden="true" /></Button>
        <output aria-label={`${name}'s score`} className="score w-12 text-center text-4xl">{value}</output>
        <Button aria-label={`Raise ${name}'s score`} className="p-2" disabled={value === max} onClick={() => onChange(value + 1)}><Plus size={16} aria-hidden="true" /></Button>
      </div>
    </div>
  );
}

export function MatchModal({ open, onOpenChange, title, idolA, idolB, bestOf, h2h, facts = [], random, onAccept, theme, marble }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string; // e.g. "Unzure Cup · R32 · Match 4"
  idolA: string;
  idolB: string;
  bestOf: BestOf;
  h2h?: HeadToHead;
  facts?: MatchFact[];
  random?: () => number; // wheel randomness (tests)
  onAccept: (result: AcceptedResult) => void;
  theme?: MatchTheme; // the competition's colour and name, grand final look (Update 3)
  marble?: (done: (games: Side[]) => void) => ReactNode; // the Marble Race mode (the app owns the 3D race)
}) {
  const a = useIdol(idolA);
  const b = useIdol(idolB);
  const hasGallery = !!(a.gallery?.length || b.gallery?.length);
  const [mode, setMode] = useState<Mode>("wheel");
  const [games, setGames] = useState<Side[]>([]);
  const [typed, setTyped] = useState<[number, number]>([0, 0]);
  const scores = finalScores(bestOf);
  const state = seriesState(bestOf, games);
  const method: MatchMethod = mode === "wheel" || mode === "marble" ? mode : "manual";
  const pending: AcceptedResult | null = state.result ? { method, scoreA: state.scoreA, scoreB: state.scoreB, result: state.result, games } : null;
  const outcome = state.result && (state.result === "D" ? "Draw" : `${state.result === "A" ? a.name : b.name} wins`);

  const switchTo = (next: Mode) => {
    setMode(next);
    setGames([]);
    setTyped([0, 0]);
  };
  const type = (next: [number, number]) => {
    setTyped(next);
    setGames(scores.some(([x, y]) => x === next[0] && y === next[1]) ? gamesForScore(...next) : []);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className={hasGallery ? "max-w-3xl lg:max-w-6xl" : "max-w-3xl"}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!pending} onClick={() => { if (pending) onAccept(pending); onOpenChange(false); }}>
            Accept Result
          </Button>
        </>
      }
    >
      {/* With a gallery: phones stack header, both strips, then the rest; wide screens put the strips left and right. */}
      <div className={hasGallery ? "grid grid-cols-1 gap-x-6 gap-y-4 [grid-template-areas:'head'_'ga'_'gb'_'rest'] lg:grid-cols-[8rem_minmax(0,1fr)_8rem] lg:[grid-template-areas:'ga_head_gb'_'ga_rest_gb']" : undefined}>
      {hasGallery && <div className="[grid-area:ga]"><MatchGallery idolId={idolA} side="A" /></div>}
      <div className="[grid-area:head]"><MatchHeader idolA={idolA} idolB={idolB} bestOf={bestOf} h2h={h2h} theme={theme} /></div>
      {hasGallery && <div className="[grid-area:gb]"><MatchGallery idolId={idolB} side="B" /></div>}
      <div className="min-w-0 [grid-area:rest]">
      {facts.length > 0 && (
        <table className="mt-4 w-full text-sm tabular-nums">
          <tbody>
            {facts.map((f) => (
              <tr key={f.label} className="odd:bg-stage-hi/50">
                <td className="w-2/5 px-2 py-1.5 text-left font-mono text-accent-bright">{f.a}</td>
                <th scope="row" className="py-1 text-center text-xs font-normal tracking-widest text-text-secondary uppercase">{f.label}</th>
                <td className="w-2/5 px-2 py-1.5 text-right font-mono text-cool">{f.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div role="radiogroup" aria-label="How to decide the result" className="mt-6 flex flex-wrap gap-2">
        {(marble ? [{ mode: "marble" as const, label: "Marble Race" }, ...MODES] : MODES).map((m) => (
          <button key={m.mode} type="button" role="radio" aria-checked={mode === m.mode} onClick={() => switchTo(m.mode)}
            className={`${mode === m.mode ? "bg-accent text-on-accent shadow-[0_8px_22px_-10px_var(--color-accent-bright)]" : "bg-stage-hi/80 text-text-secondary hover:text-text-primary"} ${CHIP}`}>
            <span className="inline-block skew-x-12">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {mode === "preset" && (
          <div role="group" aria-label="Score presets" className="flex flex-wrap justify-center gap-2">
            {scores.map(([x, y]) => (
              <button key={`${x}-${y}`} type="button" aria-pressed={state.scoreA === x && state.scoreB === y && !!state.result}
                aria-label={`${x}–${y} ${x > y ? a.name : x < y ? b.name : "draw"}`} onClick={() => setGames(gamesForScore(x, y))}
                className={`${CHIP} min-w-20 font-mono text-lg tabular-nums ${x > y ? "text-accent-bright" : x < y ? "text-cool" : "text-muted"} aria-pressed:bg-surface-hover`}>
                {x}–{y}
              </button>
            ))}
          </div>
        )}

        {mode === "manual" && (
          <div className="flex items-center justify-center gap-6">
            <Stepper name={a.name} value={typed[0]} max={seriesTarget(bestOf)} onChange={(v) => type([v, typed[1]])} />
            <span className="font-display text-xl text-text-secondary">–</span>
            <Stepper name={b.name} value={typed[1]} max={seriesTarget(bestOf)} onChange={(v) => type([typed[0], v])} />
          </div>
        )}

        {mode === "wheel" && <WheelPicker idolA={idolA} idolB={idolB} bestOf={bestOf} games={games} onChange={setGames} random={random} grand={theme?.grandFinal} />}

        {mode === "marble" && marble?.(setGames)}

        {mode !== "wheel" && (mode !== "marble" || outcome) && (
          <p className="m-0 mt-3 text-center text-sm text-text-secondary" aria-live="polite">
            {outcome ? `${state.scoreA}–${state.scoreB} · ${outcome}` : mode === "manual" ? `Not a valid Bo${bestOf} score yet` : "Pick a score"}
          </p>
        )}
      </div>
      </div>
      </div>
    </Modal>
  );
}
