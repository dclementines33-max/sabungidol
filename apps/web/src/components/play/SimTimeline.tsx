// Simulation Timeline (2026-11-16 revamp): after a bulk play, one horizontal timeline per competition just played (a tab
// each, or a dropdown when there are many; in its arena colours; one combined timeline for a whole-season play). Points snap into place and advance by
// themselves until the finale; touching the timeline stops that, Skip jumps to the finale. With prefers-reduced-motion
// nothing moves by itself. The track scrolls sideways inside the dialog, never the page.
import type { Timeline } from "@sabung/engine";
import { Button, IdolPhoto, Modal, useIdolLookup } from "@sabung/ui";
import { useEffect, useRef, useState } from "react";
import { useBranding } from "../../data/branding";
import { arenaOf } from "../competition/arenaTheme";
import { Tabs } from "../competition/Tabs";
import { Select } from "../idolDatabase/IdolFilters";
import { TimelineFinale } from "./TimelineFinale";
import { headlineOf, kickerOf, pointLabel, starOf, toneOf } from "./timelineText";
import { useSimTimeline } from "./timelineStore";

export const STEP_MS = 2200;
const TABS_UP_TO = 4;
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SimTimeline() {
  const { items, close } = useSimTimeline();
  return items ? <Popup timelines={items} close={close} /> : null; // idol hooks only while open (the shell has no idol source in tests)
}

function Popup({ timelines, close }: { timelines: Timeline[]; close: () => void }) {
  const { label } = useBranding();
  const title = (t: Timeline) => (t.track ? label(t.track) : "Whole season");
  return (
    <Modal open onOpenChange={(open) => { if (!open) close(); }} title="Simulation highlights" description={timelines.length > 1 ? `${timelines.length} competitions` : title(timelines[0]!)} className="max-w-5xl"
      footer={<Button variant="primary" onClick={close}>Close</Button>}>
      {timelines.length > TABS_UP_TO ? <Switcher timelines={timelines} title={title} />
        : timelines.length > 1 ? <Tabs label="Competition" tabs={timelines.map((t) => ({ id: t.track ?? "season", label: title(t), content: () => <Track key={t.track} t={t} /> }))} />
        : <Track t={timelines[0]!} />}
    </Modal>
  );
}

// Many competitions (a whole league phase: 13): a dropdown instead of rows of tabs, which would fill a phone screen.
function Switcher({ timelines, title }: { timelines: Timeline[]; title: (t: Timeline) => string }) {
  const [pick, setPick] = useState(timelines[0]!.track!);
  const t = timelines.find((x) => x.track === pick)!;
  return (
    <div className="space-y-4">
      <Select label="Competition" value={pick} onChange={setPick} options={timelines.map((x): [string, string] => [x.track!, title(x)])} />
      <Track key={pick} t={t} />
    </div>
  );
}

function Track({ t }: { t: Timeline }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const name = (id: string) => lookup(id)?.name ?? id;
  const list = useRef<HTMLOListElement>(null);
  const count = t.points.length + (t.finale ? 1 : 0);
  const [at, setAt] = useState(0);
  const [auto, setAuto] = useState(!reducedMotion());
  useEffect(() => {
    if (!auto || at >= count - 1) return;
    const timer = setTimeout(() => setAt(at + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [auto, at, count]);
  useEffect(() => {
    const ol = list.current;
    const card = ol?.children[at] as HTMLElement | undefined;
    if (ol && card) ol.scrollTo?.({ left: card.offsetLeft - ol.offsetLeft, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [at]);
  const stop = () => setAuto(false);
  return (
    <div data-arena={t.track ? arenaOf(t.track) : undefined} className="min-w-0">
      <ol ref={list} tabIndex={0} aria-label="Timeline" onPointerDown={stop} onWheel={stop} onKeyDown={stop}
        className="m-0 flex min-w-0 snap-x snap-mandatory list-none gap-4 overflow-x-auto p-0 pb-3 focus-visible:outline-2 focus-visible:outline-accent-bright">
        {t.points.map((p, i) => (
          <li key={`${p.comp}${p.stage}${p.round}`} aria-current={i === at ? "step" : undefined} className="flex w-[min(18rem,78vw)] shrink-0 snap-start flex-col">
            <p className="m-0 flex items-center gap-2 border-t border-border-strong pt-2">
              <span aria-hidden="true" className={`-mt-[13px] size-3 shrink-0 rounded-full ${i <= at ? "bg-accent-bright" : "bg-surface-hover"}`} />
              <span className="kicker">{pointLabel(p, label, t.track === null)}</span>
            </p>
            <ul className="m-0 mt-3 flex max-h-80 list-none flex-col gap-3 overflow-y-auto p-0">
              {p.stories.map((s, j) => (
                <li key={j} className="flex items-start gap-3">
                  <IdolPhoto idolId={starOf(s)} size={64} className="w-10 shrink-0 rounded-control" />
                  <span className="min-w-0">
                    <span lang="id" className="block text-xs font-bold tracking-[0.2em] uppercase" style={{ color: toneOf(s) }}>{kickerOf(s)}</span>
                    <span lang="id" className="block font-display text-sm leading-tight">{headlineOf(s, name, label)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {t.finale && (
          <li aria-current={at === count - 1 ? "step" : undefined} className="w-[min(20rem,82vw)] shrink-0 snap-start border-t-2 border-accent-bright pt-2">
            <TimelineFinale finale={t.finale} name={name} label={label} />
          </li>
        )}
      </ol>
      {count > 1 && at < count - 1 && <Button className="mt-2" onClick={() => { stop(); setAt(count - 1); }}>Skip to the end</Button>}
    </div>
  );
}
