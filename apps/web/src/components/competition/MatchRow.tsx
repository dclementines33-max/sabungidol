// One match line: "A  2–1  B". An open match is the click target itself (no separate "Main" button)
// and opens the MatchModal; a played one just shows its score. Design round 2 (Fight Night): a fight-card row — photos
// on both sides, the score in a skewed scoreboard chip, the winner lit and the loser dimmed; an open match shows VS.
// Official rivals (2026-11-18) get a gold VS and a "Grudge match" line under the row.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import { Flame } from "@sabung/ui/icons";
import { useRivalries } from "../rivalry/useRivalries";

const ROW = "grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-[4px] px-2 py-1.5 text-sm";

export function MatchRow({ a, b, score, busy, onOpen }: { a: string; b: string; score?: string; busy?: boolean; onOpen?: () => void }) {
  const lookup = useIdolLookup();
  const grudge = useRivalries().of(a, b); // official rivals: a Grudge Match, marked with a flame
  const [sa, sb] = (score ?? "").split("–").map(Number);
  const won = score === undefined || sa === sb ? null : sa! > sb! ? "a" : "b";
  const side = (id: string, me: "a" | "b") => (
    <span className={`flex min-w-0 items-center gap-2 ${me === "a" ? "flex-row-reverse text-right" : ""} ${won && won !== me ? "text-text-secondary" : ""}`}>
      <span aria-hidden="true" className="shrink-0"><IdolPhoto idolId={id} size={64} className={`h-8 w-6 rounded-[3px] ${won && won !== me ? "opacity-60 grayscale" : ""}`} /></span>
      <span className={`truncate ${won === me ? "font-display uppercase text-text-primary" : ""}`}>{lookup(id)?.name ?? id}</span>
    </span>
  );
  const body = (
    <>
      {side(a, "a")}
      {score === undefined
        ? <span className={`vs w-14 text-center text-base uppercase ${grudge ? "text-winner" : ""}`}>vs</span>
        : <span className="score flex w-16 -skew-x-12 items-center justify-center bg-bg-base/80 py-1 text-base shadow-[inset_0_-2px_0_var(--color-accent-bright)]"><span className="skew-x-12">{score}</span></span>}
      {side(b, "b")}
      {grudge && <span className="col-span-3 -mt-1 flex items-center justify-center gap-1 text-[10px] font-extrabold tracking-[0.3em] text-winner uppercase"><Flame aria-hidden="true" size={12} className="icon-tone" />Grudge match · {grudge.name}</span>}
    </>
  );
  if (score !== undefined || !onOpen) return <div className={`${ROW} bg-stage-hi/40`}>{body}</div>;
  return (
    <button type="button" disabled={busy} onClick={onOpen}
      className={`${ROW} cursor-pointer bg-stage-hi/80 shadow-[inset_3px_0_0_var(--color-accent-bright)] transition-[background-color,box-shadow] hover:bg-surface-hover hover:shadow-[inset_3px_0_0_var(--color-accent-bright),0_0_28px_-12px_var(--color-accent-bright)] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent-bright`}>
      <span className="sr-only">Play </span>{body}
    </button>
  );
}
