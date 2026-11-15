// Unzure Cup grand final celebration (2026-11-16): once the final's Wheel result is accepted, a full-screen moment —
// light beams, confetti, the trophy, the champion's photo and the run to the title (Swiss → LCQ → groups → knockout).
// Unzure arena theme (data-arena: gold accent). Pure CSS; with prefers-reduced-motion the beams stand still and no confetti falls.
import * as Dialog from "@radix-ui/react-dialog";
import { Button, IdolPhoto, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import type { CSSProperties } from "react";
import { engine } from "../../data/engineClient";
import { queryClient } from "../../data/queryClient";
import { useCurrentSeason } from "../../data/seasonQuery";
import { arenaOf } from "../competition/arenaTheme";
import { type Celebration, useCelebration } from "./celebrationStore";

const COLORS = ["accent-bright", "brand-violet", "brand-gold", "brand-amber", "text-primary"];
const COMPS = ["SWS", "LCQ", "UZC"];
const STAGES = ["SW", "LQ", "GS", "KO", "FN"];
const KO_NAMES: Record<string, string> = { R1: "Round of 32", R2: "Round of 16", QF: "Quarter-final", SF: "Semi-final", F: "Final" };
const roundRank = (r: string) => ({ QF: 97, SF: 98, F: 99 })[r] ?? Number(r.replace(/\D/g, "") || 0);
const stepName = (m: { comp: string; stage: string; round: string }) =>
  m.stage === "SW" ? `Swiss ${m.round}` : m.stage === "LQ" ? `LCQ ${m.round}` : m.stage === "GS" ? `Group ${m.round.split("-")[0]}` : KO_NAMES[m.round] ?? m.round;

const CSS = `
@keyframes gf-beam { from { transform: rotate(var(--r)) scaleY(0.6); opacity: .25 } to { transform: rotate(calc(var(--r) + 14deg)) scaleY(1); opacity: .7 } }
@keyframes gf-fall { from { transform: translateY(-10vh) rotate(0) } to { transform: translateY(110vh) rotate(720deg) } }
@media (prefers-reduced-motion: reduce) { .gf-beam { animation: none !important } .gf-confetti { display: none } }`;

export function GrandFinalCelebration() {
  const { now, close } = useCelebration();
  return now ? <Stage now={now} close={close} /> : null; // idol hooks only while open
}

function Stage({ now, close }: { now: Celebration; close: () => void }) {
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const season = useCurrentSeason();
  const { data: run = [] } = useQuery({
    queryKey: ["unzure-run", season?.id, now.champion],
    queryFn: async () => (await engine().matchPage({ seasonId: season!.id, comps: COMPS, idolId: now.champion }, { limit: 60, newest: false })).rows,
    enabled: !!season, staleTime: 0,
  }, queryClient);
  const steps = [...run].sort((a, b) => COMPS.indexOf(a.comp) - COMPS.indexOf(b.comp) || STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage) || roundRank(a.round) - roundRank(b.round))
    .filter((m) => m.round !== "3RD");
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Content data-arena={arenaOf("UZC")} aria-describedby={undefined} className="fixed inset-0 z-60 overflow-x-hidden overflow-y-auto bg-bg-base text-text-primary">
          <style>{CSS}</style>
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute inset-0" style={{ background: "radial-gradient(50rem 30rem at 50% 30%, color-mix(in srgb, var(--color-brand-violet) 35%, transparent), transparent 70%)" }} />
            {[-40, -20, 0, 20, 40].map((r, i) => (
              <span key={r} className="gf-beam absolute -top-1/4 left-1/2 h-[140vh] w-24 origin-top -translate-x-1/2"
                style={{ "--r": `${r}deg`, transform: `rotate(${r}deg)`, background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-${i % 2 ? "accent-bright" : "brand-violet"}) 45%, transparent), transparent 70%)`, animation: `gf-beam ${3 + i * 0.4}s ease-in-out ${i * 0.2}s infinite alternate` } as CSSProperties} />
            ))}
            {Array.from({ length: 48 }, (_, i) => (
              <span key={i} className="gf-confetti absolute -top-4 h-3 w-1.5 rounded-sm"
                style={{ left: `${(i * 37) % 100}%`, background: `var(--color-${COLORS[i % COLORS.length]})`, animation: `gf-fall ${4 + (i % 5)}s linear ${(i % 12) * 0.35}s infinite` }} />
            ))}
          </div>
          <div className="relative mx-auto flex min-h-full max-w-4xl flex-col items-center gap-6 px-4 py-12 text-center">
            <p className="kicker m-0">Unzure Cup · Grand Final</p>
            <div className="relative animate-rise">
              <p aria-hidden="true" className="outline-text pointer-events-none absolute top-1/3 left-1/2 -z-10 -translate-x-1/2 m-0 font-display text-[clamp(4rem,14vw,10rem)] leading-none whitespace-nowrap opacity-70">Champion</p>
              <IdolPhoto idolId={now.champion} size={1024} className="photo-frame w-56 sm:w-72" />
              <Trophy aria-hidden="true" className="absolute -right-8 -bottom-6 size-20 drop-shadow-[0_0_24px_var(--color-accent-bright)] text-accent-bright" />
            </div>
            <Dialog.Title className="m-0 font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-none">{name(now.champion)}</Dialog.Title>
            <p className="m-0 text-lg text-text-secondary">wins the Unzure Cup · {now.score} against {name(now.runnerUp)}</p>
            {steps.length > 0 && (
              <section aria-label="Run to the title" className="w-full">
                <p className="kicker m-0 mb-3 text-text-secondary">Run to the title</p>
                <ol className="m-0 flex list-none flex-wrap justify-center gap-2 p-0">
                  {steps.map((m, i) => {
                    const mine = m.idolA === now.champion;
                    const won = m.result === (mine ? "A" : "B");
                    return (
                      <li key={m.id} className="animate-rise rounded-control bg-surface px-3 py-2 text-left" style={{ animationDelay: `${300 + i * 80}ms` }}>
                        <p className="m-0 text-xs text-text-secondary">{stepName(m)}</p>
                        <p className="m-0 text-sm"><span className={won ? "text-cool" : m.result === "D" ? "text-muted" : "text-danger"}>{won ? "W" : m.result === "D" ? "D" : "L"} {mine ? `${m.scoreA}–${m.scoreB}` : `${m.scoreB}–${m.scoreA}`}</span> vs {name(mine ? m.idolB : m.idolA)}</p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
            <Dialog.Close asChild><Button variant="primary">Continue</Button></Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
