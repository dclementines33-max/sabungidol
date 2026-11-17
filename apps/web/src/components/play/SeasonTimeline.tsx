// The season's three phases (PRD §4) with each competition's status; each opens its panel.
import type { CompetitionKey } from "@sabung/shared";
import { Link } from "@tanstack/react-router";
import { PANEL_OF } from "./competitionLinks";

type Competition = { key: CompetitionKey; name: string; played: number; status: "off" | "none" | "waiting" | "next" | "running" | "finished" };
const PHASES: [string, CompetitionKey[]][] = [
  ["Opener (last season's champions)", ["DSG", "MBK"]],
  ["League phase", ["D1", "D2", "IDL"]],
  ["Cup phase", ["SWS", "LCQ", "UZC", "BS", "NUG", "INK"]],
];
const STATUS = {
  off: { label: "Off", className: "text-text-secondary line-through" },
  none: { label: "Starts next season", className: "text-text-secondary" },
  waiting: { label: "Waiting", className: "bg-bg-base/70 text-text-secondary" },
  next: { label: "Ready to play", className: "bg-cool text-on-fill" },
  running: { label: "Live", className: "bg-accent-bright text-on-fill" },
  finished: { label: "Done", className: "bg-winner/90 text-on-fill" },
};

export function SeasonTimeline({ competitions }: { competitions: readonly Competition[] }) {
  const byKey = new Map(competitions.map((c) => [c.key, c]));
  return (
    <ol className="m-0 grid list-none gap-8 p-0 lg:grid-cols-3" aria-label="Season phases">
      {PHASES.map(([phase, keys], i) => (
        <li key={phase} className="panel relative isolate overflow-hidden p-5 pt-6">
          <span aria-hidden="true" className="score absolute -top-3 right-2 -z-10 text-[5.5rem] text-accent/40">{String(i + 1).padStart(2, "0")}</span>
          <h2 className="section-title mb-4 text-lg">{phase}</h2>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {keys.map((key) => {
              const c = byKey.get(key)!;
              return (
                <li key={key}>
                  <Link to="/play/$comp" params={{ comp: PANEL_OF[key] }} className="flex items-center gap-3 rounded-[4px] bg-stage-hi/60 px-3 py-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
                    <span className="min-w-0 flex-1 font-display text-sm uppercase">{c.name}</span>
                    <span className="font-mono text-xs text-text-secondary tabular-nums">{c.played}</span>
                    <span className={`chip shrink-0 ${STATUS[c.status].className}`}><span>{STATUS[c.status].label}</span></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
