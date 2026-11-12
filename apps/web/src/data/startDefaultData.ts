// Run once when the app opens: load the default idol data into a new database, then create Season 1
// as a draft, and refresh what changed. The Worker decides whether there is anything to do.
import { engine } from "./engineClient";
import { IDOLS_QUERY } from "./IdolDataProvider";
import { notify } from "./notices";
import { queryClient } from "./queryClient";
import { SEASON_QUERY } from "./seasonQuery";

let started = false;

export function startDefaultData(): void {
  if (started || typeof Worker === "undefined") return;
  started = true;
  engine().loadDefaultData().then((result) => {
    if (result) {
      // The Worker already wrote this to event_log (it is the "loaded" marker), so only show it.
      notify({ level: "success", message: `${result.loaded} idol dari data bawaan dimuat` }, { log: false });
      queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    }
    startFirstSeason();
    remindBackup();
  }, (error) => {
    console.error("Default idol data not loaded", error);
    notify({ level: "error", code: "E-SEED-001", message: "Data idol bawaan gagal dimuat. Muat ulang halaman untuk mencoba lagi.", context: error instanceof Error ? error.message : String(error) });
  });
}

function startFirstSeason(): void {
  engine().ensureFirstSeason().then((season) => {
    if (!season?.created) return; // a season exists already, or too few active idols for 12 leagues
    notify({ level: "info", message: `Season 1 (draft) dibuat: 240 idol di 12 liga, ${season.reserves} cadangan` });
    queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
  }, (error) => {
    console.error("Season 1 not created", error);
    notify({ level: "error", code: "E-SEASON-001", message: "Season 1 gagal dibuat. Muat ulang halaman untuk mencoba lagi.", context: error instanceof Error ? error.message : String(error) });
  });
}

// PRD §12.3: a reminder when there has been no backup for over 7 days (once a day at most).
export function remindBackup(): void {
  if (typeof Worker === "undefined") return;
  engine().backupDue().then((due) => {
    if (due) notify({ level: "warning", code: "W-BACKUP-001", message: "Sudah lebih dari 7 hari tanpa backup. Buat backup di Settings → Backup." }, { oncePerDay: true });
  }, () => {}); // the database error is reported elsewhere
}
