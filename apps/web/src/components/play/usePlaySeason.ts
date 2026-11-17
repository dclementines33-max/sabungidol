// Playing part of the season from any screen (simulator, competition panels): progress while it runs,
// a notice when it ends, and every season view refreshed afterwards.
import { useIdolLookup } from "@sabung/ui";
import { useState } from "react";
import { arenaPool } from "../../data/arenaSettings";
import { engine, onProgress } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import type { PlayTarget } from "../../data/seasonRunner";
import { useSimTimeline } from "./timelineStore";

// Engine notices name idols by id; people read names.
export const withNames = (text: string, name: (id: string) => string | undefined) => text.replace(/\b[0-9A-HJKMNP-TV-Z]{26}\b/g, (id) => name(id) ?? id);

export function usePlaySeason() {
  const lookup = useIdolLookup();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const play = async (target: PlayTarget) => {
    setProgress({ done: 0, total: 1 });
    try {
      const result = await engine().playSeason(target, onProgress(setProgress), arenaPool());
      notify({ level: "success", message: `${result.added.toLocaleString("en-GB")} matches played${result.paused ? " (paused)" : ""}${result.done ? ". Season complete!" : ""}` });
      if (result.added > 1 && result.highlights.length) useSimTimeline.getState().show(result.highlights); // bulk plays only
      result.notices.forEach((message) => notify({ level: "info", message: withNames(message, (id) => lookup(id)?.name) }, { log: false }));
    } catch (error) {
      notify({ level: "error", code: "E-PLAY-001", message: "Simulation stopped. Saved matches are safe.", context: error instanceof Error ? error.message : String(error) });
    } finally {
      setProgress(null);
      await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
    }
  };
  return { progress, running: progress !== null, play };
}
