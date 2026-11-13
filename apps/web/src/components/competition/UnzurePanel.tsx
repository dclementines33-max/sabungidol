// The road to the Unzure Cup (PRD §4, §8): Swiss Play-in, Last Chance Qualifier, the 4 pots and
// the 16 drawn groups (the pot preview promised in Fase 2: from real standings), then the knockout.
import { Button, SwissPlayInBracket, TournamentBracketTree, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import { PlayMatchDialog } from "../play/PlayMatchDialog";
import { usePlaySeason } from "../play/usePlaySeason";
import { GroupTable } from "./GroupTable";
import { Tabs } from "./Tabs";

const LETTERS = "ABCDEFGHIJKLMNOP";
const COMPS = ["SWS", "LCQ", "UZC"];

export function UnzurePanel() {
  const season = useCurrentSeason();
  const lookup = useIdolLookup();
  const { progress, running, play } = usePlaySeason();
  const [matchId, setMatchId] = useState<string | null>(null);
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "cup", "unzure", season?.status], queryFn: () => engine().cupView(COMPS), enabled: season?.status === "live" });
  if (!season || season.status === "draft") return <p className="text-text-secondary">Mulai season di Sabung Idol untuk memainkan Unzure Cup.</p>;
  if (!view) return <p className="text-text-secondary">Membaca Unzure Cup…</p>;
  const next = view.cells.find((c) => !c.winner);
  const swiss = (view.draws.swiss ?? []).map((ids, g) => ({
    ids,
    rounds: [...new Set(view.cells.filter((c) => c.stage === "SW" && c.round.startsWith(`${LETTERS[g]}-`) && c.winner).map((c) => c.round))]
      .map((round) => view.cells.filter((c) => c.round === round && c.stage === "SW" && c.winner).map((c) => ({ a: c.a, b: c.b, winner: c.winner! }))),
  }));
  const ko = view.cells.filter((c) => c.comp === "UZC" && c.stage !== "GS");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || !next} onClick={() => play({ kind: "round", comp: next!.comp, stage: next!.stage, round: next!.round })}>Main ronde berikutnya</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "comps", comps: COMPS })}>Main sampai juara</Button>
        {progress && <span role="status" className="text-sm text-text-secondary">Memainkan… {progress.done}</span>}
        {view.cells.length === 0 && <span className="text-sm text-text-secondary">Swiss dimulai setelah fase liga selesai.</span>}
      </div>
      <Tabs label="Unzure Cup" tabs={[
        { id: "swiss", label: "Swiss Play-in", content: () => (
          <div className="grid gap-6 xl:grid-cols-2">{swiss.map((s, g) => <SwissPlayInBracket key={g} group={LETTERS[g]!} seededIds={s.ids} rounds={s.rounds} />)}</div>
        ) },
        { id: "lcq", label: "LCQ", content: () => (
          <div className="grid gap-6 md:grid-cols-2">{view.lcqTables.map((rows, g) => <GroupTable key={g} name={`Grup ${LETTERS[g]}`} rows={rows} through={4} />)}</div>
        ) },
        { id: "pots", label: "Pot & undian", content: () => (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {(view.draws.pots ?? []).map((pot, p) => (
                <div key={p}><h3 className="m-0 mb-1 text-sm font-medium">Pot {p + 1}</h3><ol className="m-0 pl-5 text-sm">{pot.map((id) => <li key={id}>{lookup(id)?.name}</li>)}</ol></div>
              ))}
            </div>
            {!view.draws.pots && <p className="m-0 text-sm text-text-secondary">Pot terisi setelah liga, Swiss dan LCQ selesai.</p>}
          </div>
        ) },
        { id: "groups", label: "Grup", content: () => (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{view.groupTables.map((rows, g) => <GroupTable key={g} name={`Grup ${LETTERS[g]}`} rows={rows} through={2} />)}</div>
        ) },
        { id: "ko", label: "Knockout", content: () => (ko.length ? <TournamentBracketTree cells={ko} onMatchClick={(cell) => { const match = ko.find((c) => c.key === cell.key); if (match && !match.winner && !running) setMatchId(match.id); }} /> : <p className="m-0 text-sm text-text-secondary">Babak 32 besar dimulai setelah fase grup.</p>) },
      ]} />
      <PlayMatchDialog matchId={matchId} onClose={() => setMatchId(null)} />
    </div>
  );
}
