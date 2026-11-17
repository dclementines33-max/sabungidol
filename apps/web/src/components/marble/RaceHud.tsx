// The broadcast overlay over the 3D race (from the prototype's hud.js, in the app's Fight Night look): the scoreboard on
// top, the arena and clock top-left, the live standing on the right — every row is a button: tap a name and the camera
// follows that marble (tap again for the leader) — one chip per game at the bottom, and the intro card, start lights and
// banners in the middle.
import type { RacePlayer, RaceSnapshot } from "../../marble/controller";
import { COLORS } from "../../marble/controller";

const seriesTarget = (bestOf: number) => (bestOf === 4 ? 3 : (bestOf + 1) / 2);
const SKEW = "-skew-x-12 [&>*]:skew-x-12";

export function Face({ p, k, className = "size-10" }: { p: RacePlayer; k: number; className?: string }) {
  return p.photo
    ? <img src={p.photo} alt="" className={`${className} shrink-0 rounded-full border-[3px] object-cover`} style={{ borderColor: COLORS[k] }} />
    : <span aria-hidden="true" className={`${className} score grid shrink-0 place-items-center rounded-full border-[3px] bg-stage`} style={{ borderColor: COLORS[k] }}>{p.name[0]}</span>;
}

function Scoreboard({ s, players }: { s: RaceSnapshot; players: RacePlayer[] }) {
  const st = s.standing;
  if (!st || !s.arena) return null;
  const mid = (
    <div className={`${SKEW} flex min-w-36 flex-col items-center justify-center bg-winner px-4 py-1 text-bg-base`}>
      <span className="text-[9px] font-extrabold tracking-[0.16em] whitespace-nowrap uppercase">{s.grandFinal ? "Grand final · " : ""}{s.gp ? `Grand Prix · ${players.length} marbles` : `Best of ${s.bestOf} · first to ${seriesTarget(s.bestOf)}`}</span>
      <strong className="score text-lg whitespace-nowrap">{s.gp ? `Race ${s.g + 1} / ${s.bestOf}` : `Game ${s.g + 1}`}</strong>
      <span className="max-w-40 truncate text-[10px] font-extrabold tracking-[0.08em] uppercase opacity-75">{s.arena.name}</span>
    </div>
  );
  if ("a" in st) {
    const side = (k: 0 | 1, pts: number) => (
      <div className={`${SKEW} flex items-center gap-2 bg-stage-hi/95 px-3 py-1.5 ${k ? "flex-row-reverse" : ""}`} style={{ boxShadow: `inset 0 -3px 0 ${COLORS[k]}` }}>
        <Face p={players[k]!} k={k} className="size-9" />
        <span className="hidden max-w-36 truncate text-sm font-extrabold tracking-[0.06em] uppercase sm:inline">{players[k]!.name}</span>
        <b className="score min-w-7 text-center text-xl text-white" style={{ textShadow: `0 0 18px ${COLORS[k]}` }}>{pts}</b>
      </div>
    );
    return <div className="flex items-stretch gap-1 drop-shadow-[0_10px_24px_rgb(0_0_0/0.6)]">{side(0, st.a)}{mid}{side(1, st.b)}</div>;
  }
  return (
    <div className="flex items-stretch gap-1 drop-shadow-[0_10px_24px_rgb(0_0_0/0.6)]">
      {mid}
      {st.table.slice(0, 3).map((k, i) => (
        <div key={k} className={`${SKEW} hidden items-center gap-2 bg-stage-hi/95 px-2 py-1 sm:flex`} style={{ boxShadow: `inset 0 -3px 0 ${COLORS[k]}` }}>
          <b className="score text-sm" style={{ color: COLORS[k] }}>{i + 1}</b><Face p={players[k]!} k={k} className="size-7" />
          <span className="max-w-24 truncate text-xs font-extrabold uppercase">{players[k]!.name}</span><b className="score text-base">{st.points[k]}</b>
        </div>
      ))}
    </div>
  );
}

export function RaceHud({ s, players, title, onFollow }: { s: RaceSnapshot; players: RacePlayer[]; title: string; onFollow: (k: number | null) => void }) {
  const many = players.length > 8;
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center px-2"><Scoreboard s={s} players={players} /></div>

      <header className="pointer-events-none absolute top-20 left-3 [text-shadow:0_2px_12px_#000] sm:left-5">
        <p className="kicker m-0 text-accent-bright">{title}</p>
        <p className="m-0 mt-0.5 font-gothic text-xl leading-none text-white sm:text-section">{s.arena?.name ?? "…"}</p>
        <p className="m-0 mt-1 hidden text-xs font-bold tracking-[0.12em] text-text-secondary uppercase sm:block">{s.arena?.tagline}</p>
        <p className="score m-0 mt-2 text-lg text-winner tabular-nums">{s.clock.toFixed(2)}</p>
      </header>

      {s.order.length > 0 && (
        <nav aria-label="Standing · pick a marble to follow" className="absolute top-20 right-2 w-[min(18rem,44vw)] sm:right-5">
          <p className="kicker m-0 mb-1 text-right text-[10px] text-text-secondary">{s.follow === null ? "Following the leader" : `Following ${players[s.follow]?.name}`}</p>
          <ol className="m-0 max-h-[calc(100vh-14rem)] list-none overflow-y-auto p-0">
            {s.order.map((m, i) => (
              <li key={m.k} className={many ? "mb-px" : "mb-1"}>
                <button type="button" aria-pressed={s.follow === m.k} onClick={() => onFollow(s.follow === m.k ? null : m.k)}
                  className={`${SKEW} grid w-full cursor-pointer grid-cols-[1.5rem_0.6rem_1fr_auto] items-center gap-2 bg-linear-to-r from-stage/95 to-stage-hi/85 text-left hover:from-stage-hi aria-pressed:outline-2 aria-pressed:outline-white focus-visible:outline-2 focus-visible:outline-accent-bright ${many ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-sm"}`}
                  style={{ boxShadow: `inset 3px 0 0 ${COLORS[m.k]}${m.boost ? ", 0 0 16px -4px #39ff88" : ""}` }}>
                  <span className="score">{i + 1}</span>
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: COLORS[m.k], boxShadow: `0 0 10px ${COLORS[m.k]}` }} />
                  <span className="truncate font-extrabold uppercase">{players[m.k]!.name}</span>
                  <span className="font-mono text-[0.85em] text-text-secondary">{m.note}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {s.arenas.length > 0 && (
        <div aria-label="Games" className="pointer-events-none absolute bottom-16 left-1/2 flex max-w-[calc(100%-1rem)] -translate-x-1/2 gap-1.5 overflow-hidden">
          {Array.from({ length: s.gp ? s.bestOf : Math.min(s.bestOf, Math.max(s.winners.length + (s.standing?.result != null ? 0 : 1), seriesTarget(s.bestOf))) }, (_, i) => (
            <span key={i} title={s.arenas[i]} className={`${SKEW} inline-flex flex-col items-center bg-stage/90 px-3 py-1 text-xs leading-tight font-extrabold tracking-[0.12em] uppercase ${i === s.g && s.phase !== "finished" ? "outline-2 outline-offset-2 outline-white" : ""}`}
              style={{ boxShadow: `inset 0 -3px 0 ${s.winners[i] === undefined ? "#333" : COLORS[s.winners[i]!]}` }}>
              {s.gp ? "R" : "G"}{i + 1}<small className="text-[9px] tracking-[0.08em] text-text-secondary">{s.arenas[i]?.split(" ")[0]}</small>
            </span>
          ))}
        </div>
      )}

      {s.intro && s.arena && (
        <section aria-live="polite" className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-stage/95 to-transparent px-10 py-5 text-center motion-safe:animate-fade-in">
          <p className="kicker m-0 text-accent-bright">{s.gp ? `Race ${s.g + 1} of ${s.bestOf}` : `Game ${s.g + 1} of Bo${s.bestOf}`}</p>
          <h2 className="m-0 my-1.5 font-gothic text-hero text-white [text-shadow:0_0_40px_var(--color-accent-bright)]">{s.arena.name}</h2>
          <p className="m-0 text-xs font-bold tracking-[0.14em] text-text-secondary uppercase">{s.arena.tagline}</p>
        </section>
      )}
      {s.lights > 0 && (
        <div aria-hidden="true" className="absolute top-1/3 left-1/2 flex -translate-x-1/2 gap-3.5 rounded-xl bg-bg-base/85 px-5 py-4">
          {[1, 2, 3].map((i) => <span key={i} className={`size-11 rounded-full ${i <= s.lights ? "bg-[#ff2a3d] shadow-[0_0_24px_#ff2a3d]" : "bg-[#2a0b10]"}`} />)}
        </div>
      )}
      {s.banner && (
        <p role="status" className={`${SKEW} pointer-events-none absolute top-[30%] left-1/2 m-0 -translate-x-1/2 -translate-y-1/2 bg-linear-to-r from-accent via-[#c2203a] to-accent px-7 py-2.5 font-gothic text-headline whitespace-nowrap text-white shadow-[0_0_60px_rgb(255_77_99/0.5)]`}>
          <span>{s.banner}</span>
        </p>
      )}
    </>
  );
}
