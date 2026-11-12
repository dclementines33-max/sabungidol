// Run once when the app opens: load the default idol data into a new database, then refresh the
// idol list. The Worker decides whether there is anything to load (see loadDefaultData).
import { engine } from "./engineClient";
import { IDOLS_QUERY } from "./IdolDataProvider";
import { notify } from "./notices";
import { queryClient } from "./queryClient";

let started = false;

export function startDefaultData(): void {
  if (started || typeof Worker === "undefined") return;
  started = true;
  engine().loadDefaultData().then((result) => {
    if (!result) return; // already loaded earlier
    // The Worker already wrote this to event_log (it is the "loaded" marker), so only show it.
    notify({ level: "success", message: `${result.loaded} idol dari data bawaan dimuat` }, { log: false });
    queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
  }, (error) => {
    console.error("Default idol data not loaded", error);
    notify({ level: "error", code: "E-SEED-001", message: "Data idol bawaan gagal dimuat. Muat ulang halaman untuk mencoba lagi.", context: error instanceof Error ? error.message : String(error) });
  });
}
