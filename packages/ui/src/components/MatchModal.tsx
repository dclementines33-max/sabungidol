// Play one match (PRD §9): Simulate, Manual (click the winner of each game, in order, so comebacks
// stay true) or Wheel Picker.
// Nothing is written until "Accept Result".
import { type Side, seriesState } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { useState } from "react";
import { Button } from "./Button";
import { LiveMatchVisualizer } from "./LiveMatchVisualizer";
import { type HeadToHead, MatchHeader } from "./MatchHeader";
import { Modal } from "./Modal";
import { WheelPicker } from "./WheelPicker";
import { useIdol } from "./idolSource";

export type MatchMethod = "sim" | "manual" | "wheel";
export type AcceptedResult = { method: MatchMethod; scoreA: number; scoreB: number; result: Side | "D"; games: Side[] };

const MODES: { method: MatchMethod; label: string }[] = [
  { method: "sim", label: "Simulate" },
  { method: "manual", label: "Manual" },
  { method: "wheel", label: "Wheel Picker" },
];

export function MatchModal({ open, onOpenChange, title, idolA, idolB, bestOf, h2h, simulate, random, onAccept }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string; // e.g. "Unzure Cup · R32 · Match 4"
  idolA: string;
  idolB: string;
  bestOf: BestOf;
  h2h?: HeadToHead;
  simulate: () => Side[]; // the engine's games for this match
  random?: () => number; // wheel randomness (tests)
  onAccept: (result: AcceptedResult) => void;
}) {
  const a = useIdol(idolA);
  const b = useIdol(idolB);
  const [method, setMethod] = useState<MatchMethod>("sim");
  const [games, setGames] = useState<Side[]>([]);
  const state = seriesState(bestOf, games);
  const pending: AcceptedResult | null = state.result ? { method, scoreA: state.scoreA, scoreB: state.scoreB, result: state.result, games } : null;

  const switchTo = (next: MatchMethod) => {
    setMethod(next);
    setGames([]);
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
      <div role="radiogroup" aria-label="Cara menentukan hasil" className="mt-6 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.method}
            type="button"
            role="radio"
            aria-checked={method === m.method}
            onClick={() => switchTo(m.method)}
            className={`${method === m.method ? "bg-surface-hover text-text-primary" : "text-text-secondary"} rounded-control border border-border-strong px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-accent-bright`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {method === "sim" && (games.length === 0
          ? <Button variant="primary" onClick={() => setGames(simulate())}>Simulate</Button>
          : <LiveMatchVisualizer games={games} nameA={a.name} nameB={b.name} />)}

        {method === "manual" && (
          <div className="flex flex-col items-center gap-3">
            <p className="m-0 font-mono text-2xl tabular-nums" aria-live="polite">
              {state.scoreA}–{state.scoreB}
              {state.result && <span className="ml-2 font-sans text-sm text-text-secondary">{state.result === "D" ? "Seri" : `${state.result === "A" ? a.name : b.name} menang`}</span>}
            </p>
            {games.length > 0 && (
              <ol aria-label="Pemenang tiap game" className="m-0 flex list-none flex-wrap justify-center gap-1 p-0 font-mono text-xs">
                {games.map((g, i) => <li key={i} className={`rounded-control border border-border-strong px-2 py-0.5 ${g === "A" ? "text-accent-bright" : "text-cool"}`}>G{i + 1} {g === "A" ? a.name : b.name}</li>)}
              </ol>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button disabled={!!state.result} onClick={() => setGames([...games, "A"])}>{a.name} menang game {games.length + 1}</Button>
              <Button disabled={!!state.result} onClick={() => setGames([...games, "B"])}>{b.name} menang game {games.length + 1}</Button>
              <Button disabled={games.length === 0} onClick={() => setGames(games.slice(0, -1))}>Batalkan game terakhir</Button>
            </div>
          </div>
        )}

        {method === "wheel" && <WheelPicker idolA={idolA} idolB={idolB} bestOf={bestOf} games={games} onChange={setGames} random={random} />}
      </div>
    </Modal>
  );
}
