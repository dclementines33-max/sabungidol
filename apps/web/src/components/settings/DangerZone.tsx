// Settings → Danger Zone (PRD §8): Reset Season and delete all data, each behind a typed
// confirmation. Deleting everything happens in the Worker on the next start (databaseReset.ts).
import type { SeasonRow } from "@sabung/db";
import { SEASON_COMPETITIONS, readSeasonConfig } from "@sabung/shared";
import { Button, ConfirmDialog, ResetSeasonModal } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { requestWipe } from "../../data/databaseReset";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { MAIN_DATABASE } from "../../data/storageChoice";
import { SECTION, refreshSeason } from "./settingsShared";

export function DangerZone({ season }: { season: SeasonRow }) {
  const [open, setOpen] = useState<"reset" | "stats" | "wipe" | null>(null);
  const { data: matchCount = 0 } = useQuery({ queryKey: ["match-count", open], queryFn: () => engine().matchCount() });
  const running = SEASON_COMPETITIONS.filter((c) => !readSeasonConfig(season.config).off.includes(c.key)).length;
  const reset = async ({ redraw }: { redraw: boolean }) => {
    await engine().resetSeason(season.id, redraw);
    notify({ level: "success", message: `${season.name} reset to draft${redraw ? ", leagues redrawn" : ""}` });
    await refreshSeason();
  };
  const resetStats = async () => {
    await engine().resetStatistics();
    notify({ level: "success", message: "Statistics reset: idols, ratings, leagues and rosters remain as Season 1" });
    await queryClient.invalidateQueries(); // every page's numbers changed
  };
  const wipe = async () => {
    await engine().saveSnapshot("delete all data"); // kept: snapshots live outside the database folder
    await requestWipe(await navigator.storage.getDirectory(), MAIN_DATABASE);
    location.reload();
  };
  return (
    <section className={`${SECTION} border-danger`} aria-labelledby="set-danger">
      <h2 id="set-danger" className="m-0 font-display text-danger">Danger Zone</h2>
      <div className="flex flex-wrap gap-3">
        <Button variant="danger" onClick={() => setOpen("reset")}>Reset season…</Button>
        <Button variant="danger" onClick={() => setOpen("stats")}>Reset statistics…</Button>
        <Button variant="danger" onClick={() => setOpen("wipe")}>Delete all data…</Button>
      </div>
      <ConfirmDialog open={open === "stats"} onOpenChange={(o) => setOpen(o ? "stats" : null)} danger typeToConfirm="RESET"
        title="Reset all statistics?" confirmLabel="Reset statistics"
        message="Every season (archives too), match, title, record, statistic and rating history is deleted. What stays: idols at their current ratings, groups, photos, settings, branding, leagues and rosters — as a Season 1 draft. An automatic snapshot is taken first."
        onConfirm={resetStats} />
      <ResetSeasonModal open={open === "reset"} onOpenChange={(o) => setOpen(o ? "reset" : null)} seasonName={season.name}
        matchCount={matchCount} competitionCount={running} onReset={reset} />
      <ConfirmDialog open={open === "wipe"} onOpenChange={(o) => setOpen(o ? "wipe" : null)} danger typeToConfirm="DELETE ALL"
        title="Delete all data?" confirmLabel="Delete all"
        message="Every idol, photo, season and match in this browser is deleted, then the default idols load again. This can't be undone; back up first if you still need the data."
        onConfirm={wipe} />
    </section>
  );
}
