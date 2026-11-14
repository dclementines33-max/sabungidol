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
      notify({ level: "success", message: `${result.loaded} default idols loaded` }, { log: false });
      queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    }
    startFirstSeason();
    remindBackup();
    checkIntegrityOnStart();
  }, (error) => {
    console.error("Default idol data not loaded", error);
    notify({ level: "error", code: "E-SEED-001", message: "The default idols failed to load. Reload the page to try again.", context: error instanceof Error ? error.message : String(error) });
  });
}

function startFirstSeason(): void {
  engine().ensureFirstSeason().then((season) => {
    if (!season?.created) return; // a season exists already, or too few active idols for 12 leagues
    notify({ level: "info", message: `Season 1 (draft) created: 240 idols in 12 leagues, ${season.reserves} reserves` });
    queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
  }, (error) => {
    console.error("Season 1 not created", error);
    notify({ level: "error", code: "E-SEASON-001", message: "Season 1 couldn't be created. Reload the page to try again.", context: error instanceof Error ? error.message : String(error) });
  });
}

// PRD §12.3: a reminder when there has been no backup for over 7 days (once a day at most).
export function remindBackup(): void {
  if (typeof Worker === "undefined") return;
  engine().backupDue().then((due) => {
    if (due) notify({ level: "warning", code: "W-BACKUP-001", message: "It's been over 7 days without a backup. Make one in Settings → Backup." }, { oncePerDay: true });
  }, () => {}); // the database error is reported elsewhere
}

// PRD §14.2: the integrity check at start-up; problems are listed in Settings → Data (once a day).
export function checkIntegrityOnStart(): void {
  if (typeof Worker === "undefined") return;
  engine().integrityCheck().then((issues) => {
    const errors = issues.filter((i) => i.level === "error");
    if (errors.length) notify({ level: "warning", code: "W-INT-000", message: `The integrity check found ${errors.length} problems. See Settings → Data.`, context: errors.map((e) => `${e.code}: ${e.message}`).join("\n") }, { oncePerDay: true });
  }, () => {}); // a database that cannot open is reported elsewhere
}
