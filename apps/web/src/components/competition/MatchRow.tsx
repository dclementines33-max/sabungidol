// One match line: "A  2–1  B". An open match is the click target itself (no separate "Main" button)
// and opens the MatchModal; a played one just shows its score.
import { useIdolLookup } from "@sabung/ui";

const ROW = "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-control px-2 py-1 text-sm";

export function MatchRow({ a, b, score, busy, onOpen }: { a: string; b: string; score?: string; busy?: boolean; onOpen?: () => void }) {
  const lookup = useIdolLookup();
  const nameA = lookup(a)?.name ?? a;
  const nameB = lookup(b)?.name ?? b;
  const body = (
    <>
      <span className="truncate text-right">{nameA}</span>
      <span className="w-14 text-center font-mono tabular-nums">{score ?? "vs"}</span>
      <span className="truncate text-left">{nameB}</span>
    </>
  );
  if (score !== undefined || !onOpen) return <div className={ROW}>{body}</div>;
  return (
    <button type="button" disabled={busy} onClick={onOpen}
      className={`${ROW} cursor-pointer border border-border-strong hover:border-accent-bright hover:bg-surface-hover disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-accent-bright`}>
      <span className="sr-only">Main </span>{body}
    </button>
  );
}
