// Playing part of the season from any screen (simulator, competition panels): progress while it runs,
// a notice when it ends, and every season view refreshed afterwards.
import { useState } from "react";
import { engine, onProgress } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import type { PlayTarget } from "../../data/seasonRunner";

export function usePlaySeason() {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
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
  return { progress, running: progress !== null, play };
}
