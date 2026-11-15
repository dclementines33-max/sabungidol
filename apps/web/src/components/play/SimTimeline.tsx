// Simulation Timeline (2026-11-16): after any bulk play, its highlights rise one by one along a line, in play order.
// Pure CSS delays (like KahootPodium), so every item always ends visible; Skip shows them all at once, and with
// prefers-reduced-motion they only fade in, with no delay.
import type { Highlight } from "@sabung/engine";
import { Button, IdolPhoto, Modal, useIdolLookup } from "@sabung/ui";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { KICKER, TONE, headline, starOf } from "../story/storyText";
import { useSimTimeline } from "./timelineStore";

export const STEP_MS = 650;
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SimTimeline() {
  const { items, close } = useSimTimeline();
  return items ? <Timeline items={items} close={close} /> : null; // idol hooks only while open (the shell has no idol source in tests)
}

function Timeline({ items, close }: { items: Highlight[]; close: () => void }) {
  const [skipped, setSkipped] = useState(false);
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const still = skipped || reducedMotion();
  const done = () => { setSkipped(false); close(); };
  return (
    <Modal open onOpenChange={(open) => { if (!open) done(); }} title="Simulation highlights" description={`${items.length} moments from the matches just played`} className="max-w-2xl"
      footer={<>{!still && <Button onClick={() => setSkipped(true)}>Skip</Button>}<Button variant="primary" onClick={done}>Close</Button></>}>
      <ol className="m-0 list-none border-l border-border-strong p-0 pl-6" aria-label="Highlights">
        {items.map(({ story }, i) => {
          const tone = `var(--color-${TONE[story.kind]})`;
          return (
            <li key={i} className={`relative mb-5 flex items-center gap-3 ${still ? "animate-fade-in" : "animate-rise"}`} style={{ animationDelay: still ? "0ms" : `${i * STEP_MS}ms` }}>
              <span aria-hidden="true" className="absolute top-1/2 -left-[31px] size-3 -translate-y-1/2 rounded-full" style={{ background: tone, boxShadow: `0 0 12px ${tone}` }} />
              <IdolPhoto idolId={starOf(story)} size={64} className="w-10 shrink-0 rounded-control" />
              <div className="min-w-0">
                <p lang="id" className="m-0 text-xs font-bold tracking-[0.25em] uppercase" style={{ color: tone }}>{KICKER[story.kind]}</p>
                <p lang="id" className="m-0 font-display text-sm leading-tight">{headline(story, name, label)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}
