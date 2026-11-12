// Single or double elimination bracket (PRD §9): zoom, drag to pan, highlight one idol's path.
// Off-screen match cards are skipped by the browser (content-visibility), so Nugu's 239 matches stay smooth.
import type { BracketCell } from "@sabung/engine";
import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./Button";
import { useIdolLookup } from "./idolSource";

const SECTION_LABEL: Record<string, string> = { UB: "Upper bracket", LB: "Lower bracket", FN: "Final", KO: "" };
const CARD_PX = 64; // reserved height of one match card
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5];

function Row({ idolId, won, highlight }: { idolId?: string; won: boolean; highlight: boolean }) {
  const lookup = useIdolLookup();
  const name = idolId ? (lookup(idolId)?.name ?? idolId) : "TBD";
  return (
    <span className={`${won ? "font-semibold text-accent-gold" : idolId ? "" : "text-text-secondary"} ${highlight ? "underline" : ""} block truncate`}>
      {name}
    </span>
  );
}

function MatchCard({ cell, highlightIdol, onClick }: { cell: BracketCell; highlightIdol?: string | null; onClick?: (cell: BracketCell) => void }) {
  const involved = !!highlightIdol && (cell.a === highlightIdol || cell.b === highlightIdol);
  const dimmed = !!highlightIdol && !involved;
  const body = (
    <>
      <Row idolId={cell.a} won={!!cell.winner && cell.winner === cell.a} highlight={involved && cell.a === highlightIdol} />
      <Row idolId={cell.b} won={!!cell.winner && cell.winner === cell.b} highlight={involved && cell.b === highlightIdol} />
      {cell.score && <span className="font-mono text-xs text-text-secondary tabular-nums">{cell.score}</span>}
    </>
  );
  const className = `${involved ? "border-accent-gold" : "border-border"} ${dimmed ? "opacity-40" : ""} block w-44 rounded-control border bg-surface px-2 py-1 text-left text-xs`;
  const style = { contentVisibility: "auto", containIntrinsicSize: `176px ${CARD_PX - 8}px` } as const;
  return onClick
    ? <button type="button" data-involved={involved} onClick={() => onClick(cell)} className={`${className} hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-gold`} style={style}>{body}</button>
    : <div data-involved={involved} className={className} style={style}>{body}</div>;
}

export function TournamentBracketTree({ cells, highlightIdol, onMatchClick }: {
  cells: BracketCell[];
  highlightIdol?: string | null;
  onMatchClick?: (cell: BracketCell) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Sections: one for single elimination; upper / lower / final for double elimination.
  const double = cells.some((c) => c.stage === "UB");
  const sections = new Map<string, Map<string, BracketCell[]>>();
  for (const cell of cells) {
    const section = double ? cell.stage : "KO";
    const rounds = sections.get(section) ?? new Map<string, BracketCell[]>();
    rounds.set(cell.round, [...(rounds.get(cell.round) ?? []), cell]);
    sections.set(section, rounds);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Button className="px-2 py-1" aria-label="Perkecil" disabled={zoom === ZOOMS[0]} onClick={() => setZoom(ZOOMS[ZOOMS.indexOf(zoom) - 1])}><Minus aria-hidden="true" size={16} /></Button>
        <span className="w-12 text-center font-mono text-xs tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <Button className="px-2 py-1" aria-label="Perbesar" disabled={zoom === ZOOMS.at(-1)} onClick={() => setZoom(ZOOMS[ZOOMS.indexOf(zoom) + 1])}><Plus aria-hidden="true" size={16} /></Button>
        <Button className="px-2 py-1" onClick={() => setZoom(1)}>Reset</Button>
      </div>
      <div
        ref={area}
        tabIndex={0}
        aria-label="Bracket, geser untuk melihat semua ronde"
        className="max-h-[70vh] cursor-grab overflow-auto rounded-card border border-border bg-bg-raised p-4 focus-visible:outline-2 focus-visible:outline-accent-gold"
        onPointerDown={(e) => { if (e.pointerType === "mouse" && e.target === e.currentTarget) drag.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          if (!drag.current || !area.current) return;
          area.current.scrollBy(drag.current.x - e.clientX, drag.current.y - e.clientY);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerLeave={() => { drag.current = null; }}
      >
        <div style={{ zoom }} className="flex flex-col gap-8">
          {[...sections].map(([section, rounds]) => {
            const tallest = Math.max(...[...rounds.values()].map((r) => r.length));
            return (
              <section key={section} aria-label={SECTION_LABEL[section] || "Bracket"}>
                {SECTION_LABEL[section] && <h3 className="m-0 mb-2 text-sm text-text-secondary">{SECTION_LABEL[section]}</h3>}
                <div className="flex gap-6">
                  {[...rounds].map(([round, matches]) => (
                    <div key={round} className="flex flex-col">
                      <h4 className="m-0 mb-2 font-mono text-xs text-text-secondary">{round}</h4>
                      <ol className="m-0 flex flex-1 list-none flex-col justify-around gap-2 p-0" style={{ minHeight: tallest * CARD_PX }} aria-label={`Ronde ${round}`}>
                        {matches.map((cell) => (
                          <li key={cell.key}><MatchCard cell={cell} highlightIdol={highlightIdol} onClick={onMatchClick} /></li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
