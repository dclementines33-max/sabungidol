// The road to the Unzure Cup (PRD §4, §8): Swiss Play-in, Last Chance Qualifier, the 4 pots and
// the 16 drawn groups (the pot preview promised in Fase 2: from real standings), then the knockout.
import { Button, SwissPlayInBracket, TournamentBracketTree, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import { FinalPredictions } from "../play/FinalPredictions";
import { PlayMatchDialog } from "../play/PlayMatchDialog";
import { usePlaySeason } from "../play/usePlaySeason";
import { useBranding } from "../../data/branding";
import { CompetitionCover } from "./CompetitionCover";
import { GroupStage } from "./GroupStage";
import { Tabs } from "./Tabs";

const LETTERS = "ABCDEFGHIJKLMNOP";
const COMPS = ["SWS", "LCQ", "UZC"];
const STAGE_NAME: Record<string, string> = { SW: "Swiss", LQ: "LCQ", GS: "fase grup", KO: "knockout", FN: "final" };
// Swiss, LCQ and group rounds are named per group ("A-R1"): the next round is that round in every group.
const roundOf = (c: { stage: string; round: string }) => (["SW", "LQ", "GS"].includes(c.stage) ? c.round.split("-").slice(1).join("-") : c.round);

export function UnzurePanel() {
  const season = useCurrentSeason();
  const lookup = useIdolLookup();
  const { label } = useBranding();
  const { progress, running, play } = usePlaySeason();
  const [matchId, setMatchId] = useState<string | null>(null);
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "cup", "unzure", season?.status], queryFn: () => engine().cupView(COMPS), enabled: season?.status === "live" });
  if (!season || season.status === "draft") return <p className="text-text-secondary">Mulai season di Sabung Idol untuk memainkan Unzure Cup.</p>;
  if (!view) return <p className="text-text-secondary">Membaca Unzure Cup…</p>;
  const next = view.cells.find((c) => c.id && !c.score);
  const swiss = (view.draws.swiss ?? []).map((ids, g) => ({
    ids,
    rounds: [...new Set(view.cells.filter((c) => c.stage === "SW" && c.round.startsWith(`${LETTERS[g]}-`) && c.winner).map((c) => c.round))]
      .map((round) => view.cells.filter((c) => c.round === round && c.stage === "SW" && c.winner).map((c) => ({ a: c.a, b: c.b, winner: c.winner! }))),
  }));
  const swissOpen = (g: number) => view.cells.filter((c) => c.stage === "SW" && c.id && !c.score && c.round.startsWith(`${LETTERS[g]}-`))
    .map((c) => ({ round: Number(c.round.split("-R")[1]) - 1, a: c.a, b: c.b, onOpen: () => { if (!running) setMatchId(c.id); } }));
  const ko = view.cells.filter((c) => c.comp === "UZC" && c.stage !== "GS");
  return (
    <div className="space-y-6">
      <CompetitionCover name={label("UZC")} code="UZC" issue={`${season.name} · Swiss → LCQ → Grup → Knockout`}
        hero={view.titles.UZC?.champion ?? null} heroRole="Juara"
        stats={[{ label: "Dimainkan", value: view.cells.filter((c) => c.score).length }, { label: "Menunggu", value: view.cells.filter((c) => !c.score).length }]} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || !next} onClick={() => play({ kind: "comps", comps: [next!.comp], round: roundOf(next!) })}>Main {next ? `${STAGE_NAME[next.stage]} ${roundOf(next)}` : "ronde berikutnya"}</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "stage", comp: next!.comp, stage: next!.stage })}>Main sampai akhir {next ? STAGE_NAME[next.stage] : "fase"}</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "comps", comps: COMPS })}>Main sampai juara</Button>
        {progress && <span role="status" className="text-sm text-text-secondary">Memainkan… {progress.done}</span>}
        {view.cells.length === 0 && <span className="text-sm text-text-secondary">Swiss dimulai setelah fase liga selesai.</span>}
      </div>
      <FinalPredictions cells={view.cells} title={(c) => (c.round === "3RD" ? "Perebutan juara 3" : "Final Unzure Cup")} />
      <Tabs label="Unzure Cup" tabs={[
        { id: "swiss", label: "Swiss Play-in", content: () => (
          <div className="space-y-10">{swiss.map((s, g) => <div key={g}><h3 className="m-0 mb-3 font-display text-xl">Grup <span className="font-gothic text-3xl text-accent-bright">{LETTERS[g]}</span></h3><SwissPlayInBracket group={LETTERS[g]!} seededIds={s.ids} rounds={s.rounds} open={swissOpen(g)} /></div>)}</div>
        ) },
        { id: "lcq", label: "LCQ", content: () => (
          <GroupStage tables={view.lcqTables} cells={view.cells} stage="LQ" through={4} busy={running} onOpen={setMatchId} />
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
          <GroupStage tables={view.groupTables} cells={view.cells} stage="GS" through={2} busy={running} onOpen={setMatchId} />
        ) },
        { id: "ko", label: "Knockout", content: () => (ko.length ? <TournamentBracketTree cells={ko} onMatchClick={(cell) => { const match = ko.find((c) => c.key === cell.key); if (match?.id && !match.score && !running) setMatchId(match.id); }} /> : <p className="m-0 text-sm text-text-secondary">Babak 32 besar dimulai setelah fase grup.</p>) },
      ]} />
      <PlayMatchDialog matchId={matchId} onClose={() => setMatchId(null)} />
    </div>
  );
}
