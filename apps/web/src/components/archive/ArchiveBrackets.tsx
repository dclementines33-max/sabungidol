// Season Archive → every bracket, the Swiss grid and the groups of a past season (Fase 6 step 9), read-only: the same
// views as the live panels, read through cupView for that season.
import { B_SIDE_CUPS } from "@sabung/shared";
import { SwissPlayInBracket, TournamentBracketTree } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { GalaStage } from "../competition/GalaStage";
import { GroupStage } from "../competition/GroupStage";

const LETTERS = "ABCDEFGHIJKLMNOP";
const VIEWS: { id: string; comps: string[]; label: string }[] = [
  { id: "SW", comps: ["SWS"], label: "Swiss Play-in" }, { id: "LQ", comps: ["LCQ"], label: "LCQ" }, { id: "GS", comps: ["UZC"], label: "Unzure groups" },
  { id: "UZC", comps: ["UZC"], label: "Knockout Unzure" }, { id: "IDL", comps: ["IDL"], label: "Playoff The Idols" }, { id: "INK", comps: ["INK"], label: "Inkigayo" },
  { id: "NUG", comps: ["NUG"], label: "Nugu" }, ...B_SIDE_CUPS.map((c) => ({ id: c, comps: [c], label: `B-Side ${c.slice(2)}` })),
  { id: "DSG", comps: ["DSG"], label: "Daesang" }, { id: "MBK", comps: ["MBK"], label: "Music Bank" },
];
const none = () => {};

export function ArchiveBrackets({ seasonId }: { seasonId: string }) {
  const { label } = useBranding();
  const [id, setId] = useState("UZC");
  const view = VIEWS.find((v) => v.id === id)!;
  const { data } = useQuery({ queryKey: ["archive-cup", seasonId, view.comps.join()], queryFn: () => engine().cupView(view.comps, seasonId), staleTime: Infinity });
  const swiss = (data?.draws.swiss ?? []).map((ids, g) => ({
    ids,
    rounds: [...new Set(data!.cells.filter((c) => c.stage === "SW" && c.round.startsWith(`${LETTERS[g]}-`)).map((c) => c.round))]
      .map((round) => data!.cells.filter((c) => c.round === round && c.stage === "SW" && c.winner).map((c) => ({ a: c.a, b: c.b, winner: c.winner!, score: c.score }))),
  }));
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Pick a bracket" className="flex flex-wrap gap-1">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" aria-pressed={v.id === id} onClick={() => setId(v.id)}
            className={`px-2 py-1 text-xs font-bold ${v.id === id ? "bg-accent text-on-accent" : "bg-surface-hover/60 text-text-secondary hover:text-text-primary"} focus-visible:outline-2 focus-visible:outline-accent-bright`}>{v.label}</button>
        ))}
      </div>
      {!data ? <p className="m-0 text-sm text-text-secondary">Loading…</p>
        : id === "SW" ? <div className="space-y-8">{swiss.map((s, g) => <SwissPlayInBracket key={g} group={LETTERS[g]!} seededIds={s.ids} rounds={s.rounds} />)}</div>
        : id === "LQ" ? <GroupStage tables={data.lcqTables} cells={data.cells} stage="LQ" through={4} busy onOpen={none} />
        : id === "GS" ? <GroupStage tables={data.groupTables} cells={data.cells} stage="GS" through={2} busy onOpen={none} />
        : id === "DSG" || id === "MBK" ? (data.cells.length ? <GalaStage cells={data.cells} busy onOpen={none} title={(c) => (id === "DSG" ? "Daesang" : `Music Bank · ${label(c.round)}`)} /> : <p className="m-0 text-sm text-text-secondary">Not played this season.</p>)
        : <TournamentBracketTree cells={data.cells.filter((c) => c.stage !== "GS")} />}
    </div>
  );
}
