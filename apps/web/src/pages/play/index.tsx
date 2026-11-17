// Sabung Idol, the season simulator (PRD §8): start the season, the phases with their status,
// Simulate Whole Season / until the next phase / Pause with live progress, then Season Honours.
import { Button } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, SkipForward } from "lucide-react";
import { useState } from "react";
import { SeasonClose } from "../../components/play/SeasonClose";
import { SeasonHonours } from "../../components/play/SeasonHonours";
import { SeasonTimeline } from "../../components/play/SeasonTimeline";
import { usePlaySeason } from "../../components/play/usePlaySeason";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";

export const Route = createFileRoute("/play/")({ component: SabungIdol });

function SabungIdol() {
  const season = useCurrentSeason();
  const live = season?.status === "live";
  const { data: overview } = useQuery({ queryKey: [...SEASON_QUERY, "overview", season?.id, season?.status], queryFn: () => engine().seasonOverview(), enabled: live });
  const { progress, running, play } = usePlaySeason();
  const [problems, setProblems] = useState<string[]>([]);

  const start = async () => {
    const result = await engine().startSeason();
    if (result.ok) {
      notify({ level: "success", message: `${season!.name} is underway` });
      await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
    } else setProblems(result.problems);
  };

  if (!season) return <p className="text-text-secondary">No season yet.</p>;
  if (season.status === "draft") {
    return (
      <section className="max-w-2xl space-y-4">
        <p className="m-0 font-display text-3xl uppercase">{season.name} is still a draft</p>
        <p className="m-0 text-text-secondary">Check rosters and settings in Settings, then start. Once it starts, the league rosters lock.</p>
        <Button variant="primary" onClick={start}><Play aria-hidden="true" size={16} strokeWidth={1.5} /> Start {season.name}</Button>
        {problems.length > 0 && (
          <div role="alert" className="rounded-card bg-danger/10 p-3 text-sm">
            <p className="m-0 font-medium">Can't start yet:</p>
            <ul className="m-0 mt-1 pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        )}
      </section>
    );
  }
  if (!overview) return <p className="text-text-secondary">Loading season…</p>;
  // The earliest league matchday still open, played in every league that has it (the opener goes first).
  const leagueNext = overview.pending.some((m) => m.comp === "DSG" || m.comp === "MBK") ? [] : overview.pending.filter((m) => m.stage === "LG");
  const round = leagueNext.map((m) => m.round).sort()[0];
  const matchday = round ? { round, comps: [...new Set(leagueNext.filter((m) => m.round === round).map((m) => m.comp))] } : null;
  return (
    <div className="space-y-8">
      <header className="relative isolate overflow-hidden rounded-card px-5 pt-6 pb-8 sm:px-10"
        style={{ background: "radial-gradient(40rem 22rem at 100% 0%, rgb(37 67 93 / 0.6), transparent 70%), linear-gradient(110deg, var(--color-surface-hover), var(--color-bg-base) 70%)" }}>
        <p aria-hidden="true" className="pointer-events-none absolute -top-6 right-4 -z-10 m-0 font-gothic text-ornament-xl leading-none text-accent/60">{season.number}</p>
        <p className="m-0 flex flex-wrap items-center gap-3"><span className="tag">Season Simulator</span><span className="kicker">{overview.done ? "Season complete" : "Live"}</span></p>
        <h2 className="m-0 mt-4 text-hero">{season.name}</h2>
        <p className="m-0 mt-3 flex items-baseline gap-3"><span className="font-display text-headline tabular-nums">{overview.played.toLocaleString("en-GB")}</span><span className="kicker text-text-secondary">matches played</span></p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || overview.done} onClick={() => play({ kind: "all" })}><Play aria-hidden="true" size={16} strokeWidth={1.5} /> Simulate Whole Season</Button>
        {matchday && <Button disabled={running} onClick={() => play({ kind: "comps", comps: matchday.comps, round: matchday.round })}><SkipForward aria-hidden="true" size={16} strokeWidth={1.5} /> Play matchday {Number(matchday.round.slice(2))} in every league</Button>}
        <Button disabled={running || overview.done} onClick={() => play({ kind: "phase" })}><SkipForward aria-hidden="true" size={16} strokeWidth={1.5} /> To the next phase</Button>
        <Button disabled={!running} onClick={() => engine().pauseSeason()}><Pause aria-hidden="true" size={16} strokeWidth={1.5} /> Pause</Button>
        <span className="sr-only" aria-live="polite">{overview.played.toLocaleString("en-GB")} matches played</span>
      </div>
      {progress && (
        <div role="status" aria-label="Simulation progress">
          <p className="m-0 mb-2 text-sm">Mensimulasikan… {progress.done.toLocaleString("en-GB")} / ±{progress.total.toLocaleString("en-GB")} matches</p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-hover"><div className="h-full origin-left bg-accent-bright transition-transform" style={{ transform: `scaleX(${Math.min(1, progress.done / progress.total)})` }} /></div>
        </div>
      )}
      <SeasonTimeline competitions={overview.competitions} />
      {overview.done && <SeasonHonours seasonId={season.id} titles={overview.titles} top={overview.seasonTop} />}
      <SeasonClose done={overview.done} />
    </div>
  );
}
