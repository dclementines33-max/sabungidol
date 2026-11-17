// Head to Head "tale of the tape" (PRD §8; Update 2 ref "4 head to head"): two torn photos facing each other with a
// blackletter VS, the direct W-D-L with a share bar and the games won, then both careers row by row: rating, titles,
// win rate, matches, games won, longest win streak and the last five results.
import type { CareerRow } from "@sabung/engine";
import { tierOf } from "@sabung/shared";
import { IdolPhoto, useIdol } from "@sabung/ui";
import type { ReactNode } from "react";
import { IdolLink } from "../wiki/IdolLink";
import { rivalryLabel } from "./rivalryLabel";

type Pair = { meetings: number; wins: number; draws: number; losses: number } | null;
type Form = ("W" | "D" | "L")[];
const FORM = { W: "bg-cool text-on-fill", D: "bg-muted text-on-fill", L: "bg-danger text-on-fill" };

function Side({ id, align }: { id: string; align: "left" | "right" }) {
  const idol = useIdol(id);
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${align === "right" ? "items-end text-right" : "items-start"}`}>
      <span className="tag">Tier {tierOf(idol.rating)} · {idol.rating}</span>
      <IdolPhoto idolId={id} size={1024} className="photo-frame w-32 sm:w-52" />
      <IdolLink id={id} className="font-display text-xl sm:text-3xl" />
      <p className="kicker m-0 text-text-secondary">{idol.groupName ?? "Soloist"}</p>
    </div>
  );
}

function FormRow({ form }: { form: Form }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`Last 5: ${form.join(" ") || "no games yet"}`}>
      {form.map((f, i) => <span key={i} aria-hidden="true" className={`${FORM[f]} inline-flex size-5 items-center justify-center text-[10px] font-bold`}>{f}</span>)}
    </span>
  );
}

export function H2HCompare({ a, b, pair, lineA, lineB, games, formA, formB }: {
  a: string; b: string; pair: Pair; lineA: CareerRow | null; lineB: CareerRow | null; games: [number, number]; formA: Form; formB: Form;
}) {
  const ia = useIdol(a);
  const ib = useIdol(b);
  const w = pair?.wins ?? 0;
  const d = pair?.draws ?? 0;
  const l = pair?.losses ?? 0;
  const total = Math.max(1, w + d + l);
  const record = (x: CareerRow | null) => (x ? `${Math.round(x.winRate * 100)}% (${x.wins}-${x.draws}-${x.losses})` : "0%");
  const rows: [string, ReactNode, ReactNode][] = [
    ["Rating", ia.rating, ib.rating],
    ["Titles", lineA?.titles ?? 0, lineB?.titles ?? 0],
    ["Career win rate", record(lineA), record(lineB)],
    ["Career matches", lineA?.matches ?? 0, lineB?.matches ?? 0],
    ["Games won", lineA?.gamesFor ?? 0, lineB?.gamesFor ?? 0],
    ["Longest win streak", lineA?.bestWinStreak ?? 0, lineB?.bestWinStreak ?? 0],
    ["Last 5 matches", <FormRow key="a" form={formA} />, <FormRow key="b" form={formB} />],
  ];
  return (
    <section aria-label="Comparison" className="space-y-8">
      <div className="relative isolate grid grid-cols-[1fr_auto_1fr] items-end gap-3 overflow-hidden rounded-card p-4 shadow-[inset_0_3px_0_var(--color-accent-bright),0_30px_60px_-30px_black] sm:gap-6 sm:p-8" style={{ background: "radial-gradient(30rem 14rem at 50% 0%, color-mix(in oklab, var(--color-accent-bright) 22%, transparent), transparent 70%), linear-gradient(105deg, color-mix(in oklab, var(--color-accent) 45%, transparent) 0 49.6%, transparent 49.6% 50.4%, color-mix(in oklab, var(--color-tier-f) 70%, transparent) 50.4%), repeating-linear-gradient(-55deg, rgb(255 255 255 / 0.025) 0 2px, transparent 2px 10px), var(--color-stage)" }}>
        <Side id={a} align="left" />
        <div className="pb-6 text-center">
          <p aria-hidden="true" className="m-0 font-gothic text-ornament leading-none text-accent">vs</p>
          <p className="kicker m-0 mt-2 text-text-secondary">Head-to-head record</p>
          <p className="score m-0 text-hero" aria-label={`Won ${w}, drawn ${d}, lost ${l}`}>
            <span className="text-accent-bright">{w}</span>–{d}–<span className="text-cool">{l}</span>
          </p>
          <span aria-hidden="true" className="mx-auto mt-3 flex h-3 w-44 -skew-x-12 overflow-hidden bg-bg-base/70 shadow-[0_0_24px_-8px_var(--color-accent-bright)]">
            <span className="bg-accent-bright" style={{ width: `${(w / total) * 100}%` }} /><span className="bg-muted" style={{ width: `${(d / total) * 100}%` }} /><span className="bg-cool" style={{ width: `${(l / total) * 100}%` }} />
          </span>
          <p className="m-0 mt-2 font-mono text-xs text-text-secondary">{pair?.meetings ?? 0} matches · games {games[0]}–{games[1]}</p>
          {rivalryLabel(w, d, l) && <p className="tag m-0 mt-3">{rivalryLabel(w, d, l)}</p>}
        </div>
        <Side id={b} align="right" />
      </div>
      <table className="w-full border-collapse text-sm">
        <caption className="section-title pb-4 text-left font-display text-lg uppercase">Tale of the tape</caption>
        <tbody>
          {rows.map(([label, va, vb]) => (
            <tr key={label} className="odd:bg-stage-hi/50">
              <td className="score w-1/3 px-3 py-3 text-xl text-accent-bright">{va}</td>
              <th scope="row" className="text-center text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{label}</th>
              <td className="score w-1/3 px-3 text-right text-xl text-cool">{vb}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
