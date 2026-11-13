// Play one match (PRD §9): Simulate, a preset score, a score set directly (Manual) or the Wheel Picker.
// Preset and Manual build their games with gamesForScore (alternating, winner last). Facts (season
// record, career…) sit under the header. Nothing is written until "Accept Result".
import { type Side, finalScores, gamesForScore, seriesState, seriesTarget } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { LiveMatchVisualizer } from "./LiveMatchVisualizer";
import { type HeadToHead, MatchHeader } from "./MatchHeader";
import { Modal } from "./Modal";
import { WheelPicker } from "./WheelPicker";
import { useIdol } from "./idolSource";

export type MatchMethod = "sim" | "manual" | "wheel";
export type AcceptedResult = { method: MatchMethod; scoreA: number; scoreB: number; result: Side | "D"; games: Side[] };
export type MatchFact = { label: string; a: string; b: string };
type Mode = "sim" | "preset" | "manual" | "wheel";

const MODES: { mode: Mode; label: string }[] = [
  { mode: "sim", label: "Simulate" },
  { mode: "preset", label: "Preset skor" },
  { mode: "manual", label: "Manual" },
  { mode: "wheel", label: "Wheel Picker" },
];
const CHIP = "rounded-control border border-border-strong px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-accent-bright";

function Stepper({ name, value, max, onChange }: { name: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="max-w-32 truncate text-sm text-text-secondary">{name}</span>
      <div className="flex items-center gap-2">
        <Button aria-label={`Kurangi skor ${name}`} className="p-2" disabled={value === 0} onClick={() => onChange(value - 1)}><Minus size={16} aria-hidden="true" /></Button>
        <output aria-label={`Skor ${name}`} className="w-10 text-center font-mono text-3xl tabular-nums">{value}</output>
        <Button aria-label={`Tambah skor ${name}`} className="p-2" disabled={value === max} onClick={() => onChange(value + 1)}><Plus size={16} aria-hidden="true" /></Button>
      </div>
    </div>
  );
}

export function MatchModal({ open, onOpenChange, title, idolA, idolB, bestOf, h2h, facts = [], simulate, random, onAccept }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string; // e.g. "Unzure Cup · R32 · Match 4"
  idolA: string;
  idolB: string;
  bestOf: BestOf;
  h2h?: HeadToHead;
  facts?: MatchFact[];
  simulate: () => Side[]; // the engine's games for this match
  random?: () => number; // wheel randomness (tests)
  onAccept: (result: AcceptedResult) => void;
}) {
  const a = useIdol(idolA);
  const b = useIdol(idolB);
  const [mode, setMode] = useState<Mode>("sim");
  const [games, setGames] = useState<Side[]>([]);
  const [typed, setTyped] = useState<[number, number]>([0, 0]);
  const scores = finalScores(bestOf);
  const state = seriesState(bestOf, games);
  const method: MatchMethod = mode === "sim" ? "sim" : mode === "wheel" ? "wheel" : "manual";
  const pending: AcceptedResult | null = state.result ? { method, scoreA: state.scoreA, scoreB: state.scoreB, result: state.result, games } : null;
  const outcome = state.result && (state.result === "D" ? "Seri" : `${state.result === "A" ? a.name : b.name} menang`);

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
      className="max-w-3xl"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="primary" disabled={!pending} onClick={() => { if (pending) onAccept(pending); onOpenChange(false); }}>
            Accept Result
          </Button>
        </>
      }
    >
      <MatchHeader idolA={idolA} idolB={idolB} bestOf={bestOf} h2h={h2h} />
      {facts.length > 0 && (
        <table className="mt-4 w-full text-sm tabular-nums">
          <tbody>
            {facts.map((f) => (
              <tr key={f.label} className="border-t border-border">
                <td className="w-2/5 py-1 text-left font-mono text-accent-bright">{f.a}</td>
                <th scope="row" className="py-1 text-center text-xs font-normal tracking-widest text-text-secondary uppercase">{f.label}</th>
                <td className="w-2/5 py-1 text-right font-mono text-cool">{f.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div role="radiogroup" aria-label="Cara menentukan hasil" className="mt-6 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.mode} type="button" role="radio" aria-checked={mode === m.mode} onClick={() => switchTo(m.mode)}
            className={`${mode === m.mode ? "bg-surface-hover text-text-primary" : "text-text-secondary"} ${CHIP}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {mode === "sim" && (games.length === 0
          ? <Button variant="primary" onClick={() => setGames(simulate())}>Simulate</Button>
          : <LiveMatchVisualizer games={games} nameA={a.name} nameB={b.name} />)}

        {mode === "preset" && (
          <div role="group" aria-label="Preset skor" className="flex flex-wrap justify-center gap-2">
            {scores.map(([x, y]) => (
              <button key={`${x}-${y}`} type="button" aria-pressed={state.scoreA === x && state.scoreB === y && !!state.result}
                aria-label={`${x}–${y} ${x > y ? a.name : x < y ? b.name : "seri"}`} onClick={() => setGames(gamesForScore(x, y))}
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

        {mode === "wheel" && <WheelPicker idolA={idolA} idolB={idolB} bestOf={bestOf} games={games} onChange={setGames} random={random} />}

        {mode !== "wheel" && mode !== "sim" && (
          <p className="m-0 mt-3 text-center text-sm text-text-secondary" aria-live="polite">
            {outcome ? `${state.scoreA}–${state.scoreB} · ${outcome}` : mode === "manual" ? `Skor belum sah untuk Bo${bestOf}` : "Pilih skor"}
          </p>
        )}
      </div>
    </Modal>
  );
}
