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
  waiting: { label: "Waiting", className: "text-text-secondary" },
  next: { label: "Ready to play", className: "text-cool" },
  running: { label: "Live", className: "text-accent-bright" },
  finished: { label: "Done", className: "text-cool" },
};

export function SeasonTimeline({ competitions }: { competitions: readonly Competition[] }) {
  const byKey = new Map(competitions.map((c) => [c.key, c]));
  return (
    <ol className="m-0 grid list-none gap-8 p-0 lg:grid-cols-3" aria-label="Season phases">
      {PHASES.map(([phase, keys], i) => (
        <li key={phase} className="relative pt-14">
          <span aria-hidden="true" className="absolute top-0 left-0 font-display text-[3.5rem] leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
          <h2 className="relative m-0 mb-3 border-b-2 border-accent-bright pb-2 font-display text-lg">{phase}</h2>
          <ul className="m-0 list-none space-y-2 p-0">
            {keys.map((key) => {
              const c = byKey.get(key)!;
              return (
                <li key={key}>
                  <Link to="/play/$comp" params={{ comp: PANEL_OF[key] }} className="flex items-center gap-3 border-b border-border px-1 py-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
                    <span className="min-w-0 flex-1">{c.name}</span>
                    <span className="font-mono text-xs text-text-secondary tabular-nums">{c.played}</span>
                    <span className={`w-28 text-right text-xs ${STATUS[c.status].className}`}>{STATUS[c.status].label}</span>
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
