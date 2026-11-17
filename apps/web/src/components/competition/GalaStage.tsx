// Daesang Cup and Music Bank Cup (Update 2: grand and epic): each final as a stage — two torn photos face to face,
// a blackletter "vs", the score huge, the winner lit. An open final is the button that plays it.
import { IdolPhoto, useIdolLookup } from "@sabung/ui";
import type { CupCell } from "../../data/seasonRunner";

function Fighter({ id, won, lost, align }: { id: string; won: boolean; lost: boolean; align: "left" | "right" }) {
  const idol = useIdolLookup()(id);
  return (
    <div className={`flex flex-col items-center gap-2 ${lost ? "opacity-45 grayscale" : ""}`}>
      <IdolPhoto idolId={id} size={1024} className={`photo-frame w-32 sm:w-44 ${won ? "drop-shadow-[0_0_30px_var(--color-accent-bright)]" : ""}`} />
      <p className={`m-0 font-display text-xl ${align === "left" ? "text-accent-bright" : "text-cool"}`}>{idol?.name}</p>
      <p className="kicker m-0 text-text-secondary">{idol?.groupName ?? "Solo"} · {idol?.rating}</p>
      {won && <p className="tag m-0">Champion</p>}
    </div>
  );
}

export function GalaStage({ cells, title, busy, onOpen }: { cells: CupCell[]; title: (c: CupCell) => string; busy: boolean; onOpen: (matchId: string) => void }) {
  return (
    <div className="space-y-10">
      {cells.map((c) => {
        const [sa, sb] = c.score?.split("–") ?? [];
        const open = !c.score && !!c.id;
        const body = (
          <>
            <p className="kicker m-0 text-center text-accent-bright">{title(c)}</p>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <Fighter id={c.a} won={c.winner === c.a} lost={!!c.winner && c.winner !== c.a} align="left" />
              <div className="text-center">
                {c.score
                  ? <p className="m-0 font-display text-hero leading-none tabular-nums">{sa}<span className="text-text-secondary">–</span>{sb}</p>
                  : <p className="m-0 font-gothic text-ornament leading-none text-accent">vs</p>}
                {open && <p className="kicker m-0 mt-2 text-text-primary">Click to play</p>}
              </div>
              <Fighter id={c.b} won={c.winner === c.b} lost={!!c.winner && c.winner !== c.b} align="right" />
            </div>
          </>
        );
        const cls = "relative isolate block w-full overflow-hidden px-4 py-8 text-left";
        const bg = { background: "radial-gradient(30rem 16rem at 50% 0%, color-mix(in oklab, var(--color-brand-gold) 22%, transparent), transparent 70%), radial-gradient(40rem 20rem at 50% 120%, color-mix(in oklab, var(--color-accent-bright) 30%, transparent), transparent 70%)" };
        return open
          ? <button key={c.key} type="button" disabled={busy} onClick={() => onOpen(c.id)} style={bg} className={`${cls} hover:brightness-125 focus-visible:outline-2 focus-visible:outline-accent-bright disabled:cursor-wait`}><span className="sr-only">Play </span>{body}</button>
          : <section key={c.key} aria-label={title(c)} style={bg} className={cls}>{body}</section>;
      })}
    </div>
  );
}
