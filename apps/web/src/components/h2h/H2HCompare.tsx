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
    <span className="inline-flex gap-1" role="img" aria-label={`5 terakhir: ${form.join(" ") || "belum main"}`}>
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
    ["Gelar", lineA?.titles ?? 0, lineB?.titles ?? 0],
    ["Win rate karier", record(lineA), record(lineB)],
    ["Match karier", lineA?.matches ?? 0, lineB?.matches ?? 0],
    ["Game dimenangkan", lineA?.gamesFor ?? 0, lineB?.gamesFor ?? 0],
    ["Menang beruntun terpanjang", lineA?.bestWinStreak ?? 0, lineB?.bestWinStreak ?? 0],
    ["5 match terakhir", <FormRow key="a" form={formA} />, <FormRow key="b" form={formB} />],
  ];
  return (
    <section aria-label="Perbandingan" className="space-y-8">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 sm:gap-6">
        <Side id={a} align="left" />
        <div className="pb-6 text-center">
          <p aria-hidden="true" className="m-0 font-gothic text-[clamp(3rem,9vw,6rem)] leading-none text-accent">vs</p>
          <p className="kicker m-0 mt-2 text-text-secondary">Rekor langsung</p>
          <p className="m-0 font-display text-[clamp(1.5rem,4vw,2.5rem)] tabular-nums" aria-label={`Menang ${w}, seri ${d}, kalah ${l}`}>
            <span className="text-accent-bright">{w}</span>–{d}–<span className="text-cool">{l}</span>
          </p>
          <span aria-hidden="true" className="mx-auto mt-2 flex h-2 w-40 overflow-hidden bg-surface-hover/50">
            <span className="bg-accent-bright" style={{ width: `${(w / total) * 100}%` }} /><span className="bg-muted" style={{ width: `${(d / total) * 100}%` }} /><span className="bg-cool" style={{ width: `${(l / total) * 100}%` }} />
          </span>
          <p className="m-0 mt-2 font-mono text-xs text-text-secondary">{pair?.meetings ?? 0} match · game {games[0]}–{games[1]}</p>
          {rivalryLabel(w, d, l) && <p className="tag m-0 mt-3">{rivalryLabel(w, d, l)}</p>}
        </div>
        <Side id={b} align="right" />
      </div>
      <table className="w-full border-collapse text-sm">
        <caption className="kicker pb-3 text-left text-accent-bright">Tale of the tape</caption>
        <tbody>
          {rows.map(([label, va, vb]) => (
            <tr key={label} className="border-t border-border/60">
              <td className="w-1/3 py-3 font-display text-lg tabular-nums">{va}</td>
              <th scope="row" className="text-center text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">{label}</th>
              <td className="w-1/3 text-right font-display text-lg tabular-nums">{vb}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
