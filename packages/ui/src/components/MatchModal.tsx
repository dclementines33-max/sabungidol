// Play one match (PRD §9): Simulate, Manual score (checked against the format) or Wheel Picker.
// Nothing is written until "Accept Result".
import { type Side, isFinalScore, seriesState } from "@sabung/engine";
import type { BestOf } from "@sabung/shared";
import { useState } from "react";
import { Button } from "./Button";
import { LiveMatchVisualizer } from "./LiveMatchVisualizer";
import { type HeadToHead, MatchHeader } from "./MatchHeader";
import { Modal } from "./Modal";
import { WheelPicker } from "./WheelPicker";
import { useIdol } from "./idolSource";

export type MatchMethod = "sim" | "manual" | "wheel";
// games is missing for a manual score: only the final score is known.
export type AcceptedResult = { method: MatchMethod; scoreA: number; scoreB: number; result: Side | "D"; games?: Side[] };

const MODES: { method: MatchMethod; label: string }[] = [
  { method: "sim", label: "Simulate" },
  { method: "manual", label: "Manual score" },
  { method: "wheel", label: "Wheel Picker" },
];

function ScoreInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm text-text-secondary">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-20 rounded-control border border-border-strong bg-surface px-3 py-2 font-mono text-lg text-text-primary tabular-nums focus-visible:outline-2 focus-visible:outline-accent-gold"
      />
    </label>
  );
}

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
  const [manual, setManual] = useState({ a: "", b: "" });

  const manualA = Number(manual.a);
  const manualB = Number(manual.b);
  const manualFilled = manual.a !== "" && manual.b !== "";
  const manualValid = manualFilled && Number.isInteger(manualA) && Number.isInteger(manualB) && isFinalScore(bestOf, manualA, manualB);

  const pending: AcceptedResult | null = (() => {
    if (method === "manual") {
      if (!manualValid) return null;
      const result = manualA > manualB ? "A" : manualB > manualA ? "B" : "D";
      return { method, scoreA: manualA, scoreB: manualB, result };
    }
    const state = seriesState(bestOf, games);
    return state.result ? { method, scoreA: state.scoreA, scoreB: state.scoreB, result: state.result, games } : null;
  })();

  const switchTo = (next: MatchMethod) => {
    setMethod(next);
    setGames([]);
    setManual({ a: "", b: "" });
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
            className={`${method === m.method ? "bg-surface-hover text-text-primary" : "text-text-secondary"} rounded-control border border-border-strong px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-accent-gold`}
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
          <div>
            <div className="flex items-end gap-4">
              <ScoreInput label={a.name} value={manual.a} onChange={(v) => setManual({ ...manual, a: v })} />
              <span className="pb-2 font-mono text-lg">–</span>
              <ScoreInput label={b.name} value={manual.b} onChange={(v) => setManual({ ...manual, b: v })} />
            </div>
            {manualFilled && !manualValid && (
              <p role="alert" className="m-0 mt-2 text-sm text-danger">
                {manual.a}–{manual.b} bukan skor akhir yang mungkin untuk Bo{bestOf}.
              </p>
            )}
          </div>
        )}

        {method === "wheel" && <WheelPicker idolA={idolA} idolB={idolB} bestOf={bestOf} games={games} onChange={setGames} random={random} />}
      </div>
    </Modal>
  );
}
