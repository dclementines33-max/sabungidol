// Sabung Idol, the season simulator (PRD §8): start the season, the phases with their status,
// Simulate Whole Season / until the next phase / Pause with live progress, then Season Honours.
import { Button } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, SkipForward } from "lucide-react";
import { useState } from "react";
import { SeasonHonours } from "../../components/play/SeasonHonours";
import { SeasonTimeline } from "../../components/play/SeasonTimeline";
import { engine, onProgress } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY, useCurrentSeason } from "../../data/seasonQuery";
import type { PlayTarget } from "../../data/seasonRunner";

export const Route = createFileRoute("/play/")({ component: SabungIdol });

function SabungIdol() {
  const season = useCurrentSeason();
  const live = season?.status === "live";
  const { data: overview } = useQuery({ queryKey: [...SEASON_QUERY, "overview", season?.id, season?.status], queryFn: () => engine().seasonOverview(), enabled: live });
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const start = async () => {
    const result = await engine().startSeason();
    if (result.ok) {
      notify({ level: "success", message: `${season!.name} dimulai` });
      await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
    } else setProblems(result.problems);
  };
  const play = async (target: PlayTarget) => {
    setProgress({ done: 0, total: 1 });
    try {
      const result = await engine().playSeason(target, onProgress(setProgress));
      notify({ level: "success", message: `${result.added.toLocaleString("id-ID")} match dimainkan${result.paused ? " (dijeda)" : ""}${result.done ? ". Season selesai!" : ""}` });
      result.notices.forEach((message) => notify({ level: "info", message }, { log: false }));
    } catch (error) {
      notify({ level: "error", code: "E-PLAY-001", message: "Simulasi berhenti. Match yang sudah tersimpan tetap aman.", context: error instanceof Error ? error.message : String(error) });
    } finally {
      setProgress(null);
      await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
    }
  };

  if (!season) return <p className="text-text-secondary">Belum ada season.</p>;
  if (season.status === "draft") {
    return (
      <section className="max-w-2xl space-y-4">
        <p className="m-0 font-display text-3xl uppercase">{season.name} masih draft</p>
        <p className="m-0 text-text-secondary">Periksa roster dan pengaturan di Settings, lalu mulai. Setelah dimulai, roster liga dikunci.</p>
        <Button variant="primary" onClick={start}><Play aria-hidden="true" size={16} strokeWidth={1.5} /> Mulai {season.name}</Button>
        {problems.length > 0 && (
          <div role="alert" className="rounded-card border border-danger p-3 text-sm">
            <p className="m-0 font-medium">Belum bisa dimulai:</p>
            <ul className="m-0 mt-1 pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        )}
      </section>
    );
  }
  if (!overview) return <p className="text-text-secondary">Membaca season…</p>;
  const running = progress !== null;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={running || overview.done} onClick={() => play({ kind: "all" })}><Play aria-hidden="true" size={16} strokeWidth={1.5} /> Simulate Whole Season</Button>
        <Button disabled={running || overview.done} onClick={() => play({ kind: "phase" })}><SkipForward aria-hidden="true" size={16} strokeWidth={1.5} /> Sampai fase berikutnya</Button>
        <Button disabled={!running} onClick={() => engine().pauseSeason()}><Pause aria-hidden="true" size={16} strokeWidth={1.5} /> Pause</Button>
        <span className="font-mono text-sm text-text-secondary tabular-nums" aria-live="polite">{overview.played.toLocaleString("id-ID")} match dimainkan</span>
      </div>
      {running && (
        <div role="status" aria-label="Progres simulasi">
          <p className="m-0 mb-2 text-sm">Mensimulasikan… {progress.done.toLocaleString("id-ID")} / ±{progress.total.toLocaleString("id-ID")} match</p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-hover"><div className="h-full origin-left bg-accent-bright transition-transform" style={{ transform: `scaleX(${Math.min(1, progress.done / progress.total)})` }} /></div>
        </div>
      )}
      <SeasonTimeline competitions={overview.competitions} />
      {overview.done && <SeasonHonours titles={overview.titles} uzcThird={overview.uzcThird} />}
    </div>
  );
}
