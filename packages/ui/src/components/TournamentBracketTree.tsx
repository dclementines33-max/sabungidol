// Single or double elimination bracket (PRD §9; Update 2 ref "1 bracket"): every slot drawn from the start (sides
// still unknown stay blank), round names, connector lines between rounds, the winner's row filled, a score per side.
// Zoom, drag to pan, highlight one idol's path. Off-screen cards are skipped by the browser (content-visibility).
// Update 3: the (grand) final sits at the right end, joined to the last rounds, larger; the 3rd place match under it.
import type { BracketCell } from "@sabung/engine";
import { Minus, Plus, Trophy } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./Button";
import { IdolPhoto } from "./IdolPhoto";
import { useIdolLookup } from "./idolSource";

const SECTION_LABEL: Record<string, string> = { UB: "Upper bracket", LB: "Lower bracket", FN: "Final", KO: "" };
const CARD_PX = 92; // reserved height of one match card
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5];
const NAMED: Record<string, string> = { F: "Final", GF: "Grand final", SF: "Semifinal", QF: "Perempat final", "3RD": "Juara 3" };
const FINALS = new Set(["F", "GF", "3RD"]);
const roundName = (round: string, count: number, section: string) =>
  section === "LB" ? (round === "LF" ? "Final lower" : round === "SF" ? "Semifinal lower" : `Lower ronde ${round.slice(2)}`)
    : section === "UB" ? ({ UF: "Final upper", R1: "Ronde 1" }[round] ?? NAMED[round] ?? round)
      : NAMED[round] ?? (count > 1 ? `${count * 2} besar` : round);

function Side({ idolId, score, won, highlight, big }: { idolId?: string; score?: string; won: boolean; highlight: boolean; big?: boolean }) {
  const idol = useIdolLookup()(idolId ?? "");
  return (
    <span className={`flex ${big ? "h-14 text-base" : "h-8"} items-center gap-2 pr-1 ${won ? "bg-accent/30 text-text-primary" : "bg-bg-base/50 text-text-secondary"} ${highlight ? "shadow-[inset_3px_0_0_var(--color-accent-bright)]" : ""}`}>
      {idolId ? <IdolPhoto idolId={idolId} size={big ? 256 : 64} className={`${big ? "h-14 w-12" : "h-8 w-7"} shrink-0`} /> : <span className={`${big ? "h-14 w-12" : "h-8 w-7"} shrink-0 bg-surface-hover/40`} />}
      <span className={`flex-1 truncate ${won ? "font-bold" : ""}`}>{idolId ? (idol?.name ?? idolId) : <span className="sr-only">TBD</span>}</span>
      {idol && <span className="font-mono text-[10px] text-text-secondary">{idol.rating}</span>}
      <span className={`${big ? "w-8 text-2xl" : "w-5"} text-center font-mono tabular-nums ${won ? "text-accent-bright" : ""}`}>{score ?? ""}</span>
    </span>
  );
}

function MatchCard({ cell, highlightIdol, onClick, big }: { cell: BracketCell; highlightIdol?: string | null; onClick?: (cell: BracketCell) => void; big?: boolean }) {
  const involved = !!highlightIdol && (cell.a === highlightIdol || cell.b === highlightIdol);
  const dimmed = !!highlightIdol && !involved;
  const [sa, sb] = cell.score?.split("–") ?? [];
  const open = !!cell.a && !!cell.b && !cell.winner;
  const body = (
    <>
      <span className="flex justify-between px-1 pb-0.5 text-[9px] font-bold tracking-[0.18em] text-text-secondary uppercase">
        <span>{big ? <span className="flex items-center gap-1 text-brand-gold"><Trophy aria-hidden="true" size={12} />{NAMED[cell.round]}</span> : `#${cell.slot}`}</span><span className={cell.winner ? "text-cool" : open ? "text-accent-bright" : ""}>{cell.winner ? "Selesai" : open ? "Main" : ""}</span>
      </span>
      <Side idolId={cell.a} score={sa} won={!!cell.winner && cell.winner === cell.a} highlight={involved && cell.a === highlightIdol} big={big} />
      <Side idolId={cell.b} score={sb} won={!!cell.winner && cell.winner === cell.b} highlight={involved && cell.b === highlightIdol} big={big} />
    </>
  );
  const className = `${dimmed ? "opacity-40" : ""} block ${big ? "w-80 p-2 [background:linear-gradient(160deg,var(--color-accent),var(--color-surface)_55%,var(--color-bg-raised))] [box-shadow:inset_0_3px_0_var(--color-brand-gold),0_0_70px_-12px_var(--color-accent-bright)]" : "w-52 bg-surface/80 p-1 shadow-lg shadow-black/40"} text-left text-xs`;
  const style = big ? {} : { contentVisibility: "auto", containIntrinsicSize: `208px ${CARD_PX - 12}px` } as const;
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
  const finals = cells.filter((c) => c.round === "F" || c.round === "GF");
  const thirds = cells.filter((c) => c.round === "3RD");
  for (const cell of cells) {
    if (FINALS.has(cell.round)) continue;
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
        <div style={{ zoom }} className="flex w-max items-stretch">
        <div className="flex flex-col gap-10">
          {[...sections].map(([section, rounds]) => {
            const list = [...rounds];
            const tallest = Math.max(...list.map(([, r]) => r.length));
            return (
              <section key={section} aria-label={SECTION_LABEL[section] || "Bracket"}>
                {SECTION_LABEL[section] && <h3 className="kicker m-0 mb-3 text-accent-bright">{SECTION_LABEL[section]}</h3>}
                <div className="flex gap-8">
                  {list.map(([round, matches], r) => {
                    // A connector joins two cards to the next round's card when that round has half as many.
                    const joins = list[r + 1] ? list[r + 1]![1].length === matches.length / 2 : !double && finals.length > 0 && matches.length === 2;
                    const fed = r > 0 && list[r - 1]![1].length === matches.length * 2;
                    const pairs = joins ? Array.from({ length: matches.length / 2 }, (_, i) => matches.slice(i * 2, i * 2 + 2)) : matches.map((m) => [m]);
                    return (
                      <div key={round} className="flex flex-col">
                        <h4 className="m-0 mb-3 bg-surface-hover/60 px-3 py-1 text-center text-[10px] font-bold tracking-[0.2em] uppercase">{roundName(round, matches.length, section)}</h4>
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
          {finals.length > 0 && (
            <section aria-label="Final" className="relative flex items-center pl-10">
              <span aria-hidden="true" className="absolute top-1/2 left-0 h-0.5 w-10 bg-accent-bright/60" />
              {double && <span aria-hidden="true" className="absolute top-1/4 bottom-1/4 left-0 w-0.5 bg-accent-bright/50" />}
              <div className="relative">
                <h4 className="m-0 mb-3 text-center font-gothic text-3xl text-brand-gold">{NAMED[finals[0]!.round]}</h4>
                <ol className="m-0 list-none p-0" aria-label={`Ronde ${finals[0]!.round}`}>
                  {finals.map((cell) => <li key={cell.key}><MatchCard cell={cell} highlightIdol={highlightIdol} onClick={onMatchClick} big /></li>)}
                </ol>
                {thirds.length > 0 && (
                  <ol className="absolute top-full left-0 m-0 mt-6 list-none p-0" aria-label="Ronde 3RD">
                    <li className="mb-1 text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{NAMED["3RD"]}</li>
                    {thirds.map((cell) => <li key={cell.key}><MatchCard cell={cell} highlightIdol={highlightIdol} onClick={onMatchClick} /></li>)}
                  </ol>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
