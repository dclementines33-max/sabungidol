// A league panel (PRD §8): pick the league (A–F), then Overview / Klasemen / Fixtures / Roster, with
// play controls for the next matchday or the rest of the league.
import { Button, IdolCard } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { CompetitionLogo } from "../CompetitionLogo";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import { PlayMatchDialog } from "../play/PlayMatchDialog";
import { usePlaySeason } from "../play/usePlaySeason";
import { CompetitionCover } from "./CompetitionCover";
import { LeagueFixtures } from "./LeagueFixtures";
import { LeagueStandings } from "./LeagueStandings";
import { Tabs } from "./Tabs";

export function LeaguePanel({ codes, zoneKey }: { codes: string[]; zoneKey: string }) {
  const season = useCurrentSeason();
  const [comp, setComp] = useState(codes[0]!);
  const [matchId, setMatchId] = useState<string | null>(null);
  const { progress, running, play } = usePlaySeason();
  const { brand } = useBranding();
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
          {codes.map((c) => (
            <Button key={c} aria-pressed={c === comp} className={`gap-2 border-l-4 px-3 ${c === comp ? "bg-surface-hover" : ""}`} style={{ borderLeftColor: brand(c).color ? `var(--color-${brand(c).color})` : undefined }} onClick={() => setComp(c)}>
              <CompetitionLogo logoId={brand(c).logoId} className="size-5" />{brand(c).name}
            </Button>
          ))}
        </div>
      )}
      <CompetitionCover name={brand(comp).name} code={comp} color={brand(comp).color} logoId={brand(comp).logoId}
        issue={`${season.name} · Fase liga`} hero={leader?.played ? leader.idolId : null}
        stats={[
          { label: "Matchday", value: `${playedMds}/38` },
          { label: "Poin pemimpin", value: leader?.points ?? 0 },
          { label: "Berikutnya", value: next ? `MD ${Number(next.slice(2))}` : "Selesai" },
        ]} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || !next} onClick={() => play({ kind: "round", comp, stage: "LG", round: next! })}>Main matchday berikutnya</Button>
        <Button disabled={running || !next} onClick={() => play({ kind: "stage", comp, stage: "LG" })}>Main sampai akhir liga</Button>
        {progress && <span role="status" className="text-sm text-text-secondary">Memainkan… {progress.done}</span>}
      </div>
      <Tabs label={`Panel ${comp}`} tabs={[
        { id: "overview", label: "Overview", content: () => (
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0" aria-label="Lima teratas">
            {view.standings.slice(0, 5).map((r, i) => (
              <li key={r.idolId} className="relative"><span aria-hidden="true" className="absolute -top-3 -left-1 z-[1] font-gothic text-2xl text-accent-bright">{i + 1}</span><IdolCard idolId={r.idolId} /></li>
            ))}
          </ol>
        ) },
        { id: "table", label: "Klasemen", content: () => <LeagueStandings zoneKey={zoneKey} rows={view.standings} form={view.form} positions={view.positions} /> },
        { id: "fixtures", label: "Fixtures", content: () => (
          <LeagueFixtures fixtures={view.fixtures} busy={running} onPlay={(what) => ("id" in what ? setMatchId(what.id) : play({ kind: "round", comp, stage: "LG", round: what.round }))} />
        ) },
        { id: "roster", label: "Roster", content: () => (
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0">{view.roster.map((id) => <li key={id}><IdolCard idolId={id} /></li>)}</ul>
        ) },
      ]} />
      <PlayMatchDialog matchId={matchId} onClose={() => setMatchId(null)} />
    </div>
  );
}
