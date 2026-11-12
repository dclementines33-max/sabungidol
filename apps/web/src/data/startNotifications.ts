// Run once when the app opens: connect the notification store to event_log (through the Worker),
// load earlier history, and warn if the browser refuses persistent storage (PRD §12, §14.3).
import { engine } from "./engineClient";
import { notify, useNotices } from "./notices";
import { askPersistentStorage } from "./persistentStorage";

export const STORAGE_REFUSED =
  "Browser belum mengizinkan penyimpanan permanen, jadi data bisa terhapus saat ruang penyimpanan penuh. Buat backup secara rutin.";

export function startNotifications(): void {
  if (useNotices.getState().persister) return; // already started
  if (typeof Worker !== "undefined") {
    useNotices.setState({ persister: { log: (event, options) => engine().logEvent(event, options), list: () => engine().listEvents() } });
    useNotices.getState().loadHistory().catch((error) => {
      // shortcut: history stays empty if the database cannot open; Fase 1 step 12 reports Worker failures to the user.
      console.error("Notification history not loaded from event_log", error, error?.cause);
    });
  }
  askPersistentStorage().then((granted) => {
    if (granted === false) notify({ level: "warning", code: "W-STORAGE-001", message: STORAGE_REFUSED }, { oncePerDay: true });
  });
}
