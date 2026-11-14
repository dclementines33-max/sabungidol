// A league panel (PRD §8): pick the league (A–F), then Overview / Klasemen / Fixtures / Roster, with
// play controls for the next matchday or the rest of the league.
import { Button, IdolCard, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { CompetitionLogo } from "../CompetitionLogo";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import { PlayMatchDialog } from "../play/PlayMatchDialog";
import { usePlaySeason } from "../play/usePlaySeason";
import { averageRating } from "./averageRating";
import { CompetitionCover } from "./CompetitionCover";
import { LeagueFixtures } from "./LeagueFixtures";
import { LeagueStandings } from "./LeagueStandings";
import { Tabs } from "./Tabs";


// playoff: an extra tab after Roster (The Idols' double elimination playoff, Update 3); actions: extra buttons
// beside the play buttons (The Idols' Sync rating, Update 4), told whether a play is running.
export function LeaguePanel({ codes, zoneKey, playoff, actions }: { codes: string[]; zoneKey: string; playoff?: () => ReactNode; actions?: (running: boolean) => ReactNode }) {
  const season = useCurrentSeason();
  const [comp, setComp] = useState(codes[0]!);
  const [matchId, setMatchId] = useState<string | null>(null);
  const { progress, running, play } = usePlaySeason();
  const { brand } = useBranding();
  const idol = useIdolLookup();
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "league", comp, season?.status], queryFn: () => engine().leagueView(comp), enabled: season?.status === "live" });
  if (!season || season.status === "draft") return <p className="text-text-secondary">Start the season in Sabung Idol to play this league.</p>;
  if (!view) return <p className="text-text-secondary">Loading league…</p>;

  const playedMds = view.fixtures.filter((f) => f.matches.every((m) => m.scoreA !== undefined)).length;
  const next = view.fixtures.find((f) => f.matches.some((m) => m.scoreA === undefined))?.round;
  const leader = view.standings[0];
  return (
    <div className="space-y-6">
      {codes.length > 1 && (
        <div className="flex flex-wrap gap-1" role="group" aria-label="League">
          {codes.map((c) => (
            <Button key={c} aria-pressed={c === comp} className={`gap-2 border-l-4 px-3 ${c === comp ? "bg-surface-hover" : ""}`} style={{ borderLeftColor: brand(c).color ? `var(--color-${brand(c).color})` : undefined }} onClick={() => setComp(c)}>
              <CompetitionLogo logoId={brand(c).logoId} className="size-5" />{brand(c).name}
            </Button>
          ))}
        </div>
      )}
      <CompetitionCover name={brand(comp).name} code={comp} color={brand(comp).color} logoId={brand(comp).logoId}
        issue={`${season.name} · League phase`} hero={leader?.played ? leader.idolId : null}
        stats={[
          { label: "Matchday", value: `${playedMds}/38` },
          { label: "Leader's points", value: leader?.points ?? 0 },
          { label: "Average rating", value: averageRating(view.roster.flatMap((id) => idol(id)?.rating ?? [])) },
          { label: "Next up", value: next ? `MD ${Number(next.slice(2))}` : "Done" },
        ]} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || !next} onClick={() => play({ kind: "round", comp, stage: "LG", round: next! })}>Play next matchday</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "stage", comp, stage: "LG" })}>Play to the end of the league</Button>
        {codes.length > 1 && <Button disabled={running} onClick={() => play({ kind: "comps", comps: codes })}>Simulate every league</Button>}
        {actions?.(running)}
        {progress && <span role="status" className="text-sm text-text-secondary">Memainkan… {progress.done}</span>}
      </div>
      <Tabs label={`Panel ${comp}`} tabs={[
        { id: "overview", label: "Overview", content: () => (
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0" aria-label="Top five">
            {view.standings.slice(0, 5).map((r) => <li key={r.idolId}><IdolCard idolId={r.idolId} /></li>)}
          </ol>
        ) },
        { id: "table", label: "Standings", content: () => <LeagueStandings zoneKey={zoneKey} rows={view.standings} form={view.form} positions={view.positions} /> },
        { id: "fixtures", label: "Fixtures", content: () => (
          <LeagueFixtures fixtures={view.fixtures} busy={running} onPlay={(what) => ("id" in what ? setMatchId(what.id) : play({ kind: "round", comp, stage: "LG", round: what.round }))} />
        ) },
        { id: "roster", label: "Roster", content: () => (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0">{view.roster.map((id) => <li key={id}><IdolCard idolId={id} /></li>)}</ul>
        ) },
        ...(playoff ? [{ id: "playoff", label: "Playoff", content: playoff }] : []),
      ]} />
      <PlayMatchDialog matchId={matchId} onClose={() => setMatchId(null)} />
    </div>
  );
}
