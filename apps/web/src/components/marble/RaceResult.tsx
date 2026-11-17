// The end of a marble match: a duel's winner (or a draw) with the score and every game's arena and winner, or a Grand
// Prix podium with the points table. `action` = what the screen offers next (use the result, race again…).
import type { ReactNode } from "react";
import type { RacePlayer, RaceSnapshot } from "../../marble/controller";
import { COLORS } from "../../marble/controller";
import { Face } from "./RaceHud";

const POINTS = "25-18-15-12-10-8-6-4-2-1";

export function RaceResult({ s, players, actions }: { s: RaceSnapshot; players: RacePlayer[]; actions: ReactNode }) {
  const st = s.standing!;
  let body: ReactNode;
  if ("a" in st) {
    const w = st.result === "D" || st.result === null ? null : st.result === "A" ? 0 : 1;
    body = (
      <>
        <p className="kicker m-0 text-accent-bright">{w === null ? "Draw" : "Match winner"} · Bo{s.bestOf}</p>
        {w !== null && <div className="mt-3 flex justify-center"><Face p={players[w]!} k={w} className="size-32" /></div>}
        <h2 className="m-0 mt-3 font-gothic text-headline text-winner">{w === null ? "All square" : players[w]!.name}</h2>
        <p className="score m-0 my-2 text-hero text-white"><span style={{ color: COLORS[0] }}>{st.a}</span> – <span style={{ color: COLORS[1] }}>{st.b}</span></p>
        <table className="mx-auto mt-3 text-sm">
          <tbody>
            {s.winners.map((k, g) => (
              <tr key={g}><td className="px-3 py-1 text-text-secondary">Game {g + 1}</td><td className="px-3 py-1">{s.arenas[g]}</td><td className="px-3 py-1 font-bold" style={{ color: COLORS[k] }}>{players[k]!.name}</td></tr>
            ))}
          </tbody>
        </table>
      </>
    );
  } else {
    const top = st.table.slice(0, 3);
    body = (
      <>
        <p className="kicker m-0 text-accent-bright">Grand Prix champion · {s.bestOf} races · {players.length} marbles</p>
        <div className="my-3 flex items-end justify-center gap-2">
          {[1, 0, 2].filter((i) => top[i] !== undefined).map((i) => (
            <div key={i} className="flex w-32 flex-col items-center gap-1 pt-2" style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${COLORS[top[i]!]} 35%, transparent), transparent)` }}>
              <Face p={players[top[i]!]!} k={top[i]!} className={i === 0 ? "size-20" : "size-14"} />
              <b className="max-w-full truncate px-1 text-sm">{players[top[i]!]!.name}</b>
              <span className="text-xs text-text-secondary">{st.points[top[i]!]} pts</span>
              <i className="score text-2xl not-italic" style={{ color: COLORS[top[i]!] }}>{i + 1}</i>
            </div>
          ))}
        </div>
        <table className="board w-full text-sm">
          <thead><tr><th>#</th><th className="text-left">Marble</th><th>Wins</th><th>Pts</th></tr></thead>
          <tbody>{st.table.map((k, i) => <tr key={k}><td className="rank">{i + 1}</td><td style={{ color: COLORS[k] }}>{players[k]!.name}</td><td>{st.wins[k]}</td><td className="pts">{st.points[k]}</td></tr>)}</tbody>
        </table>
        <p className="m-0 mt-2 text-xs text-text-secondary">Points per race: {POINTS}.</p>
      </>
    );
  }
  return (
    <div className="absolute inset-0 grid place-items-center overflow-auto bg-[radial-gradient(circle_at_50%_40%,rgb(125_0_24/0.55),rgb(1_0_3/0.85)_70%)] p-4">
      <section aria-live="polite" aria-label="Race result" className="stage w-full max-w-xl rounded-card p-6 text-center shadow-[inset_0_4px_0_var(--color-winner),0_30px_80px_rgb(0_0_0/0.7)]">
        {body}
        <div className="mt-5 flex flex-wrap justify-center gap-3">{actions}</div>
      </section>
    </div>
  );
}
