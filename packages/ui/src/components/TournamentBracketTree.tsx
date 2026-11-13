// Single or double elimination bracket (PRD §9; Update 2 ref "1 bracket"): every slot drawn from the start (sides
// still unknown stay blank), round names, connector lines between rounds, the winner's row filled, a score per side.
// Zoom, drag to pan, highlight one idol's path. Off-screen cards are skipped by the browser (content-visibility).
import type { BracketCell } from "@sabung/engine";
import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./Button";
import { IdolPhoto } from "./IdolPhoto";
import { useIdolLookup } from "./idolSource";

const SECTION_LABEL: Record<string, string> = { UB: "Upper bracket", LB: "Lower bracket", FN: "Final", KO: "" };
const CARD_PX = 92; // reserved height of one match card
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5];
const NAMED: Record<string, string> = { F: "Final", GF: "Grand final", SF: "Semifinal", QF: "Perempat final", "3RD": "Juara 3" };
const roundName = (round: string, count: number) => NAMED[round] ?? (count > 1 ? `${count * 2} besar` : round);

function Side({ idolId, score, won, highlight }: { idolId?: string; score?: string; won: boolean; highlight: boolean }) {
  const idol = useIdolLookup()(idolId ?? "");
  return (
    <span className={`flex h-8 items-center gap-2 pr-1 ${won ? "bg-accent/30 text-text-primary" : "bg-bg-base/50 text-text-secondary"} ${highlight ? "shadow-[inset_3px_0_0_var(--color-accent-bright)]" : ""}`}>
      {idolId ? <IdolPhoto idolId={idolId} size={64} className="h-8 w-7 shrink-0" /> : <span className="h-8 w-7 shrink-0 bg-surface-hover/40" />}
      <span className={`flex-1 truncate ${won ? "font-bold" : ""}`}>{idolId ? (idol?.name ?? idolId) : <span className="sr-only">TBD</span>}</span>
      {idol && <span className="font-mono text-[10px] text-text-secondary">{idol.rating}</span>}
      <span className={`w-5 text-center font-mono tabular-nums ${won ? "text-accent-bright" : ""}`}>{score ?? ""}</span>
    </span>
  );
}

function MatchCard({ cell, highlightIdol, onClick }: { cell: BracketCell; highlightIdol?: string | null; onClick?: (cell: BracketCell) => void }) {
  const involved = !!highlightIdol && (cell.a === highlightIdol || cell.b === highlightIdol);
  const dimmed = !!highlightIdol && !involved;
  const [sa, sb] = cell.score?.split("–") ?? [];
  const open = !!cell.a && !!cell.b && !cell.winner;
  const body = (
    <>
      <span className="flex justify-between px-1 pb-0.5 text-[9px] font-bold tracking-[0.18em] text-text-secondary uppercase">
        <span>#{cell.slot}</span><span className={cell.winner ? "text-cool" : open ? "text-accent-bright" : ""}>{cell.winner ? "Selesai" : open ? "Main" : ""}</span>
      </span>
      <Side idolId={cell.a} score={sa} won={!!cell.winner && cell.winner === cell.a} highlight={involved && cell.a === highlightIdol} />
      <Side idolId={cell.b} score={sb} won={!!cell.winner && cell.winner === cell.b} highlight={involved && cell.b === highlightIdol} />
    </>
  );
  const className = `${dimmed ? "opacity-40" : ""} block w-52 bg-surface/80 p-1 text-left text-xs shadow-lg shadow-black/40`;
  const style = { contentVisibility: "auto", containIntrinsicSize: `208px ${CARD_PX - 12}px` } as const;
  return onClick && cell.a && cell.b // a slot whose sides are not known yet is not a target
    ? <button type="button" data-involved={involved} onClick={() => onClick(cell)} className={`${className} hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright`} style={style}>{body}</button>
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
        className="max-h-[80vh] cursor-grab overflow-auto p-4 focus-visible:outline-2 focus-visible:outline-accent-bright"
        style={{ background: "radial-gradient(40rem 20rem at 100% 50%, rgb(255 77 99 / 0.12), transparent 70%)" }}
        onPointerDown={(e) => { if (e.pointerType === "mouse" && e.target === e.currentTarget) drag.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          if (!drag.current || !area.current) return;
          area.current.scrollBy(drag.current.x - e.clientX, drag.current.y - e.clientY);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerLeave={() => { drag.current = null; }}
      >
        <div style={{ zoom }} className="flex flex-col gap-10">
          {[...sections].map(([section, rounds]) => {
            const list = [...rounds];
            const tallest = Math.max(...list.map(([, r]) => r.length));
            return (
              <section key={section} aria-label={SECTION_LABEL[section] || "Bracket"}>
                {SECTION_LABEL[section] && <h3 className="kicker m-0 mb-3 text-accent-bright">{SECTION_LABEL[section]}</h3>}
                <div className="flex gap-8">
                  {list.map(([round, matches], r) => {
                    // A connector joins two cards to the next round's card when that round has half as many.
                    const joins = list[r + 1]?.[1].length === matches.length / 2;
                    const fed = r > 0 && list[r - 1]![1].length === matches.length * 2;
                    const pairs = joins ? Array.from({ length: matches.length / 2 }, (_, i) => matches.slice(i * 2, i * 2 + 2)) : matches.map((m) => [m]);
                    return (
                      <div key={round} className="flex flex-col">
                        <h4 className="m-0 mb-3 bg-surface-hover/60 px-3 py-1 text-center text-[10px] font-bold tracking-[0.2em] uppercase">{roundName(round, matches.length)}</h4>
                        <ol className="m-0 flex flex-1 list-none flex-col justify-around p-0" style={{ minHeight: tallest * CARD_PX }} aria-label={`Ronde ${round}`}>
                          {pairs.map((pair, p) => (
                            <li key={p} className="relative flex flex-1 flex-col justify-around">
                              {pair.length === 2 && <span aria-hidden="true" className="absolute top-1/4 -right-4 bottom-1/4 w-4 border-y-2 border-r-2 border-accent-bright/50" />}
                              {pair.map((cell) => (
                                <div key={cell.key} className="relative py-1">
                                  {fed && <span aria-hidden="true" className="absolute top-1/2 -left-4 h-0.5 w-4 bg-accent-bright/50" />}
                                  <MatchCard cell={cell} highlightIdol={highlightIdol} onClick={onMatchClick} />
                                </div>
                              ))}
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
