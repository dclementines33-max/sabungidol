// Fase 1 check (not in the menu): run the sample season in the Worker, save it, and measure
// whether the main thread ever blocked longer than 50 ms (PRD §5.10, §13). Uses its own database,
// so the sample idols never mix with real data.
import { Banner, Button, ErrorPanel, StatTile } from "@sabung/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { engine, onProgress } from "../../data/engineClient";
import { SLOW_STORAGE_NOTICE } from "../../data/storageChoice";
import type { Progress, SampleRun } from "../../data/worker";

export const Route = createFileRoute("/dev/worker")({ component: WorkerCheck });

const DATABASE = "sabung-idol-devcheck";
type Result = SampleRun & { totalMs: number; longestTaskMs: number; longTasks: number };
const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;

function WorkerCheck() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = progress !== null && result === null && error === null;

  const run = async () => {
    setResult(null);
    setError(null);
    setProgress({ phase: "simulating", done: 0, total: 1 });
    const longTasks: number[] = [];
    const observer = new PerformanceObserver((list) => list.getEntries().forEach((e) => longTasks.push(e.duration)));
    try {
      observer.observe({ type: "longtask" });
    } catch {
      // this browser cannot report long tasks; the timing still works
    }
    const started = performance.now();
    try {
      const run = await engine(DATABASE).simulateSampleSeason(onProgress(setProgress));
      setResult({ ...run, totalMs: performance.now() - started, longestTaskMs: Math.max(0, ...longTasks), longTasks: longTasks.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      observer.disconnect();
    }
  };

  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="max-w-3xl space-y-6">
      <p className="m-0 text-text-secondary">
        Menjalankan season contoh (240 idol, ±5.600 match) di Web Worker lalu menyimpannya ke database uji
        terpisah, sambil mencatat apakah layar sempat tertahan lebih dari 50 ms.
      </p>
      <Button variant="primary" onClick={run} disabled={running}>Simulasikan season contoh</Button>
      {progress && !result && !error && (
        <div>
          <p className="m-0 mb-2 text-sm">{progress.phase === "simulating" ? "Mensimulasikan…" : `Menyimpan ${progress.done.toLocaleString("id-ID")} / ${progress.total.toLocaleString("id-ID")} match`}</p>
          <div role="progressbar" aria-label="Progres" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full origin-left bg-accent-gold transition-transform" style={{ transform: `scaleX(${percent / 100})` }} />
          </div>
        </div>
      )}
      {error && <ErrorPanel code="E-WORKER-001" message="Simulasi di Worker gagal" context={error} report={`E-WORKER-001\n${error}`} />}
      {result?.storage === "indexeddb" && <Banner notice={{ id: "slow-storage", level: "warning", at: "", message: SLOW_STORAGE_NOTICE }} />}
      {result && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3" data-testid="worker-result">
          <StatTile label="Penyimpanan" value={result.storage === "opfs" ? "OPFS" : "IndexedDB"} />
          <StatTile label="Match dalam season" value={result.matches.toLocaleString("id-ID")} />
          <StatTile label="Baru tersimpan" value={result.inserted.toLocaleString("id-ID")} />
          <StatTile label="Simulasi" value={seconds(result.simulateMs)} />
          <StatTile label="Simpan ke database" value={seconds(result.saveMs)} />
          <StatTile label="Total (target < 10 s)" value={seconds(result.totalMs)} />
          <StatTile label="Long task terpanjang (target < 50 ms)" value={`${Math.round(result.longestTaskMs)} ms`} />
        </div>
      )}
    </div>
  );
}
