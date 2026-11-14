// Run once when the app opens: connect the notification store to event_log (through the Worker),
// load earlier history, and warn if the browser refuses persistent storage or has only the slow
// IndexedDB storage (PRD §12, §14.3).
import { DB_IN_OTHER_TAB } from "./dbLock";
import { engine } from "./engineClient";
import { notify, useNotices } from "./notices";
import { askPersistentStorage } from "./persistentStorage";
import { offerResetIfNeverOpened } from "./resetOffer";
import { MAIN_DATABASE, SLOW_STORAGE_NOTICE } from "./storageChoice";

export const STORAGE_REFUSED =
  "The browser hasn't allowed persistent storage, so data may be cleared when space runs low. Back up regularly.";

export const OTHER_TAB_MESSAGE = "Sabung Idol is already open in another tab. Close it, then reload this page.";

// What the user is told when the database cannot be opened (PRD §14.1: what failed, where, what next).
export function databaseErrorNotice(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return detail.startsWith(DB_IN_OTHER_TAB)
    ? { level: "error" as const, code: DB_IN_OTHER_TAB, message: OTHER_TAB_MESSAGE }
    : { level: "error" as const, code: "E-DB-001", message: "The database won't open. Saved data is untouched; try reloading the page.", context: detail };
}

export function startNotifications(): void {
  if (useNotices.getState().persister) return; // already started
  if (typeof Worker !== "undefined") {
    useNotices.setState({ persister: { log: (event, options) => engine().logEvent(event, options), list: async () => (await engine().listEvents()).filter((e) => e.code !== "PREDICTION") } });
    // Loading the history is the first database use, so a database that cannot open shows up here, once.
    useNotices.getState().loadHistory().catch((error) => {
      console.error("Notification history not loaded from event_log", error, error?.cause);
      const notice = databaseErrorNotice(error);
      notify(notice);
      if (notice.code === "E-DB-001") offerResetIfNeverOpened(MAIN_DATABASE).catch(() => {});
    });
    engine().storage().then((kind) => {
      if (kind === "indexeddb") notify({ level: "warning", code: "W-STORAGE-002", message: SLOW_STORAGE_NOTICE }, { oncePerDay: true });
    }).catch(() => {});
  }
  askPersistentStorage().then((granted) => {
    if (granted === false) notify({ level: "warning", code: "W-STORAGE-001", message: STORAGE_REFUSED }, { oncePerDay: true });
  });
}
