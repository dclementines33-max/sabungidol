// A league panel (PRD §8): pick the league (A–F), then Overview / Klasemen / Fixtures / Roster, with
// play controls for the next matchday or the rest of the league.
import { Button, IdolCard, StatTile, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import { usePlaySeason } from "../play/usePlaySeason";
import { LeagueFixtures } from "./LeagueFixtures";
import { LeagueStandings } from "./LeagueStandings";
import { Tabs } from "./Tabs";

export function LeaguePanel({ codes, zoneKey }: { codes: string[]; zoneKey: string }) {
  const season = useCurrentSeason();
  const [comp, setComp] = useState(codes[0]!);
  const { progress, running, play } = usePlaySeason();
  const lookup = useIdolLookup();
  const { data: view } = useQuery({ queryKey: [...SEASON_QUERY, "league", comp, season?.status], queryFn: () => engine().leagueView(comp), enabled: season?.status === "live" });
  if (!season || season.status === "draft") return <p className="text-text-secondary">Mulai season di Sabung Idol untuk memainkan liga ini.</p>;
  if (!view) return <p className="text-text-secondary">Membaca liga…</p>;

  const playedMds = view.fixtures.filter((f) => f.matches.every((m) => m.scoreA !== undefined)).length;
  const next = view.fixtures.find((f) => f.matches.some((m) => m.scoreA === undefined))?.round;
  const leader = view.standings[0];
  return (
    <div className="space-y-6">
      {codes.length > 1 && (
        <div className="flex flex-wrap gap-1" role="group" aria-label="Liga">
          {codes.map((c) => <Button key={c} aria-pressed={c === comp} className={`px-3 font-mono ${c === comp ? "bg-surface-hover" : ""}`} onClick={() => setComp(c)}>{c}</Button>)}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || !next} onClick={() => play({ kind: "round", comp, stage: "LG", round: next! })}>Main matchday berikutnya</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "stage", comp, stage: "LG" })}>Main sampai akhir liga</Button>
        {progress && <span role="status" className="text-sm text-text-secondary">Memainkan… {progress.done}</span>}
      </div>
      <Tabs label={`Panel ${comp}`} tabs={[
        { id: "overview", label: "Overview", content: () => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatTile label="Matchday" value={`${playedMds}/38`} />
              <StatTile label="Pemimpin" value={leader && leader.played ? lookup(leader.idolId)?.name ?? "–" : "–"} />
              <StatTile label="Poin pemimpin" value={leader?.points ?? 0} />
              <StatTile label="Berikutnya" value={next ? `MD ${Number(next.slice(2))}` : "Selesai"} />
            </div>
          </div>
        ) },
        { id: "table", label: "Klasemen", content: () => <LeagueStandings zoneKey={zoneKey} rows={view.standings} form={view.form} positions={view.positions} /> },
        { id: "fixtures", label: "Fixtures", content: () => (
          <LeagueFixtures fixtures={view.fixtures} busy={running} onPlay={(what) => play("id" in what ? { kind: "ids", ids: [what.id] } : { kind: "round", comp, stage: "LG", round: what.round })} />
        ) },
        { id: "roster", label: "Roster", content: () => (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0">{view.roster.map((id) => <li key={id}><IdolCard idolId={id} /></li>)}</ul>
        ) },
      ]} />
    </div>
  );
}
