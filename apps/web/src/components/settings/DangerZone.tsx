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
    notify({ level: "success", message: `${season.name} direset ke draft${redraw ? ", liga dibagi ulang" : ""}` });
    await refreshSeason();
  };
  const resetStats = async () => {
    await engine().resetStatistics();
    notify({ level: "success", message: "Statistik direset: tinggal idol, rating, liga dan roster sebagai Season 1" });
    await queryClient.invalidateQueries(); // every page's numbers changed
  };
  const wipe = async () => {
    await engine().saveSnapshot("hapus semua data"); // kept: snapshots live outside the database folder
    await requestWipe(await navigator.storage.getDirectory(), MAIN_DATABASE);
    location.reload();
  };
  return (
    <section className={`${SECTION} border-danger`} aria-labelledby="set-danger">
      <h2 id="set-danger" className="m-0 font-display text-danger">Danger Zone</h2>
      <div className="flex flex-wrap gap-3">
        <Button variant="danger" onClick={() => setOpen("reset")}>Reset season…</Button>
        <Button variant="danger" onClick={() => setOpen("stats")}>Reset statistik…</Button>
        <Button variant="danger" onClick={() => setOpen("wipe")}>Hapus semua data…</Button>
      </div>
      <ConfirmDialog open={open === "stats"} onOpenChange={(o) => setOpen(o ? "stats" : null)} danger typeToConfirm="RESET"
        title="Reset semua statistik?" confirmLabel="Reset statistik"
        message="Semua season (termasuk arsip), match, gelar, rekor, statistik dan riwayat rating dihapus. Yang tersisa: idol dengan rating sekarang, grup, foto, settings, branding, liga dan roster — sebagai Season 1 draft. Snapshot otomatis dibuat dulu."
        onConfirm={resetStats} />
      <ResetSeasonModal open={open === "reset"} onOpenChange={(o) => setOpen(o ? "reset" : null)} seasonName={season.name}
        matchCount={matchCount} competitionCount={running} onReset={reset} />
      <ConfirmDialog open={open === "wipe"} onOpenChange={(o) => setOpen(o ? "wipe" : null)} danger typeToConfirm="HAPUS SEMUA"
        title="Hapus semua data?" confirmLabel="Hapus semua"
        message="Semua idol, foto, season dan match di browser ini dihapus, lalu data idol bawaan dimuat lagi. Ini tidak bisa dibatalkan; buat backup dulu kalau masih butuh datanya."
        onConfirm={wipe} />
    </section>
  );
}
