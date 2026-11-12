// The season's three phases (PRD §4) with each competition's status; each opens its panel.
import type { CompetitionKey } from "@sabung/shared";
import { Link } from "@tanstack/react-router";
import { PANEL_OF } from "./competitionLinks";

type Competition = { key: CompetitionKey; name: string; played: number; status: "off" | "waiting" | "next" | "running" | "finished" };
const PHASES: [string, CompetitionKey[]][] = [
  ["Fase liga", ["D1", "D2", "IDL"]],
  ["Fase cup", ["SWS", "LCQ", "UZC", "BS", "NUG", "INK"]],
  ["Gala Night", ["DSG", "MBK"]],
];
const STATUS = {
  off: { label: "Nonaktif", className: "text-text-secondary line-through" },
  waiting: { label: "Menunggu", className: "text-text-secondary" },
  next: { label: "Siap dimainkan", className: "text-cool" },
  running: { label: "Berjalan", className: "text-accent-bright" },
  finished: { label: "Selesai", className: "text-cool" },
};

export function SeasonTimeline({ competitions }: { competitions: readonly Competition[] }) {
  const byKey = new Map(competitions.map((c) => [c.key, c]));
  return (
    <ol className="m-0 grid list-none gap-4 p-0 lg:grid-cols-3" aria-label="Fase season">
      {PHASES.map(([phase, keys]) => (
        <li key={phase} className="rounded-card border border-border bg-bg-raised p-4">
          <h2 className="m-0 mb-3 font-display text-lg">{phase}</h2>
          <ul className="m-0 list-none space-y-2 p-0">
            {keys.map((key) => {
              const c = byKey.get(key)!;
              return (
                <li key={key}>
                  <Link to="/play/$comp" params={{ comp: PANEL_OF[key] }} className="flex items-center gap-3 rounded-control px-2 py-1 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
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
