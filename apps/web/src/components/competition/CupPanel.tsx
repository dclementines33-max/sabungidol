// A cup panel (PRD §8): the champion once known, the bracket (played and next matches), and play
// controls for the next round or the rest of the cup. Several codes (B-Side A–F) get a switcher.
import { Button, IdolCard, TournamentBracketTree } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import { useBranding } from "../../data/branding";
import { PlayMatchDialog } from "../play/PlayMatchDialog";
import { arenaOf } from "./arenaTheme";
import { CompetitionCover } from "./CompetitionCover";
import { GalaStage } from "./GalaStage";
import { MatchList } from "./MatchList";
import { usePlaySeason } from "../play/usePlaySeason";

export function CupPanel({ codes, title }: { codes: string[]; title?: string }) {
  const { label, brand } = useBranding();
  const season = useCurrentSeason();
  const [comp, setComp] = useState(codes[0]!);
  const [matchId, setMatchId] = useState<string | null>(null);
  const { progress, running, play } = usePlaySeason();
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "cup", comp, season?.status], queryFn: () => engine().cupView([comp]), enabled: season?.status === "live" });
  if (!season || season.status === "draft") return <p className="text-text-secondary">Start the season in Sabung Idol to play this cup.</p>;
  if (!view) return <p className="text-text-secondary">Loading cup…</p>;
  const next = view.cells.find((c) => c.id && !c.score);
  // Nugu: the early rounds (more than 8 matches) read as plain fixtures; from the last 16 on it is a bracket.
  const size = (round: string) => view.cells.filter((c) => c.round === round).length;
  const early = comp === "NUG" ? view.cells.filter((c) => size(c.round) > 8) : [];
  const bracket = view.cells.filter((c) => !early.includes(c));
  const gala = comp === "DSG" || comp === "MBK";
  const open = (key: string) => { const match = view.cells.find((c) => c.key === key); if (match?.id && !match.score && !running) setMatchId(match.id); };
  const played = view.cells.filter((c) => c.score).length;
  const champion = Object.values(view.titles)[0]?.champion;
  return (
    <section className="space-y-6" aria-label={title ?? comp} data-arena={arenaOf(comp)}>
      {codes.length > 1 && (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Cup">
          {codes.map((c) => <Button key={c} aria-pressed={c === comp} className={`px-3 font-mono ${c === comp ? "bg-surface-hover" : ""}`} onClick={() => setComp(c)}>{c}</Button>)}
        </div>
      )}
      <CompetitionCover name={title ?? label(comp)} code={comp} issue={`${season.name} · ${played}/${view.cells.length} matches`}
        color={comp.startsWith("BS") ? brand(`D1${comp[2]}`).color : undefined} logoId={comp.startsWith("BS") ? brand(`D1${comp[2]}`).logoId : undefined}
        hero={champion ?? null} heroRole="Champion" stats={[{ label: "Played", value: played }, { label: "To play", value: view.cells.length - played }]} />
      {Object.entries(view.titles).length > 0 && ( // the champions first, the play buttons under their photos (Update 3)
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-8 p-0">
          {Object.entries(view.titles).map(([key, t]) => (
            <li key={key} className="w-48 space-y-2"><p className="m-0 line-clamp-2 h-8 text-[10px] leading-4 tracking-widest text-text-secondary uppercase">Champion {label(key)}</p><IdolCard idolId={t!.champion} /></li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="primary" disabled={running || !next} onClick={() => play({ kind: "round", comp: next!.comp, stage: next!.stage, round: next!.round })}>Play next round{next ? ` (${next.round})` : ""}</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "comps", comps: [comp] })}>Play to the end</Button>
        {codes.length > 1 && <Button disabled={running || !next} onClick={() => play({ kind: "comps", comps: codes, round: next!.round })}>{next ? `Round ${next.round}` : "Next round"} in every cup</Button>}
        {codes.length > 1 && <Button disabled={running} onClick={() => play({ kind: "comps", comps: codes })}>Every cup to the end</Button>}
        {progress && <span role="status" className="text-sm text-text-secondary">Playing… {progress.done}</span>}
        {!next && view.cells.length === 0 && <span className="text-sm text-text-secondary">{comp === "DSG" || comp === "MBK" ? "Played as next season's opener, between this season's champions." : "Waiting for the previous phase to finish."}</span>}
      </div>
      {early.length > 0 && (
        <details className="space-y-3" open={early.some((c) => !c.winner)}>
          <summary className="kicker cursor-pointer">Early rounds · {early.filter((c) => c.score).length}/{early.length} matches</summary>
          <MatchList cells={early.filter((c) => c.id)} busy={running} onOpen={setMatchId} roundLabel={(r) => `Round ${r.slice(1)}`} />
        </details>
      )}
      {gala && <GalaStage cells={view.cells} busy={running} onOpen={setMatchId} title={(c) => (comp === "DSG" ? "Daesang · Grand final" : `Music Bank · ${c.round}`)} />}
      {!gala && bracket.length > 0 && <TournamentBracketTree cells={bracket} onMatchClick={(cell) => open(cell.key)} />}
      <PlayMatchDialog matchId={matchId} onClose={() => setMatchId(null)} />
    </section>
  );
}
