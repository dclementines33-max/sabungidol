// All notifications (PRD §14.1) in one small store (Zustand, PRD §11). A notice shows at once and
// is written to event_log in the background, so the screen never waits for the database.
// Where it shows: info/success → toast, warning/error → pinned above the content until closed,
// blocker → dialog. Every one also goes to the NotificationCenter history.
import type { LoggedEvent, NewEvent } from "@sabung/db";
import type { Notice } from "@sabung/ui";
import { create } from "zustand";
import { STORAGE_FULL, STORAGE_FULL_MESSAGE, isStorageFull } from "./storageFull";

export type Persister = {
  log: (event: NewEvent, options?: { oncePerDay?: boolean }) => Promise<LoggedEvent | null>;
  list: () => Promise<LoggedEvent[]>;
};
type NewNotice = Omit<Notice, "id" | "at">;
export type NotifyOptions = { oncePerDay?: boolean; log?: boolean };

type State = {
  notices: Notice[]; // history, newest first
  unread: number;
  toasts: Notice[];
  pinned: Notice[];
  blocker: Notice | null;
  persister: Persister | null;
  notify: (notice: NewNotice, options?: NotifyOptions) => void;
  record: (notice: NewNotice) => void;
  loadHistory: () => Promise<void>;
  dismissToast: (id: string) => void;
  unpin: (id: string) => void;
  closeBlocker: () => void;
  markRead: () => void;
};

const fromLog = (e: LoggedEvent): Notice =>
  ({ id: `log-${e.id}`, level: e.level, message: e.message, code: e.code ?? undefined, at: e.at, context: e.context ? JSON.stringify(e.context) : undefined });

let counter = 0;

export const useNotices = create<State>()((set, get) => {
  // Into the history, counted as unread.
  const add = (input: NewNotice): Notice => {
    const notice: Notice = { ...input, id: `local-${++counter}`, at: new Date().toISOString() };
    set((s) => ({ notices: [notice, ...s.notices], unread: s.unread + 1 }));
    return notice;
  };

  // Into event_log, in the background; the history entry then takes the log's id.
  const persist = (notice: Notice, options?: { oncePerDay?: boolean }) => {
    const { persister } = get();
    if (!persister) return;
    const { undo: _undo, id: _id, at: _at, ...event } = notice; // functions cannot be stored
    persister.log({ ...event, context: notice.context }, options).then((logged) => {
      if (!logged) {
        // oncePerDay skipped it: today's copy is already in the history, so drop this one there (it stays pinned).
        set((s) => ({ notices: s.notices.filter((n) => n.id !== notice.id), unread: Math.max(0, s.unread - 1) }));
        return;
      }
      const swap = (n: Notice) => (n.id === notice.id ? { ...n, id: `log-${logged.id}` } : n);
      set((s) => ({ notices: s.notices.map(swap) }));
    }, (error) => {
      // The notice stays on screen. A database that cannot open is reported once at start (startNotifications).
      console.error("Notification not written to event_log", error);
    });
  };

  return {
    notices: [],
    unread: 0,
    toasts: [],
    pinned: [],
    blocker: null,
    persister: null,

    notify: (input, options) => {
      if (input.level === "error" && isStorageFull(input.context)) { // a save failed on a full disk: one clear warning, not one error per failed write
        if (get().pinned.some((p) => p.code === STORAGE_FULL)) return;
        input = { level: "warning", code: STORAGE_FULL, message: STORAGE_FULL_MESSAGE, context: `${input.code ?? ""} ${input.message} · ${input.context}` };
        options = { log: false }; // event_log can't be written either
      }
      const notice = add(input);
      set((s) => ({
        toasts: notice.level === "info" || notice.level === "success" ? [...s.toasts, notice] : s.toasts,
        // A coded warning/error that is already pinned is not pinned twice.
        pinned: (notice.level === "warning" || notice.level === "error") && !s.pinned.some((p) => p.code && p.code === notice.code)
          ? [...s.pinned, notice] : s.pinned,
        blocker: notice.level === "blocker" ? notice : s.blocker,
      }));
      if (options?.log !== false) persist(notice, options); // log: false = already in event_log (written by the Worker)
    },

    // History and event_log only, for something already shown in its own place (e.g. a panel's error card).
    record: (input) => persist(add(input)),

    // Earlier visits' history, merged under anything already shown this visit.
    loadHistory: async () => {
      const { persister } = get();
      if (!persister) return;
      const history = (await persister.list()).map(fromLog);
      set((s) => {
        const shown = new Set(s.notices.map((n) => n.id));
        return { notices: [...s.notices, ...history.filter((n) => !shown.has(n.id))] };
      });
    },

    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    unpin: (id) => set((s) => ({ pinned: s.pinned.filter((p) => p.id !== id) })),
    closeBlocker: () => set({ blocker: null }),
    markRead: () => set({ unread: 0 }),
  };
});

export const notify = (notice: NewNotice, options?: NotifyOptions) => useNotices.getState().notify(notice, options);

// "Ekspor" in the NotificationCenter: the notices shown, as a JSON file.
export function exportNotices(shown: Notice[]): void {
  const blob = new Blob([JSON.stringify(shown.map(({ undo: _undo, ...n }) => n), null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `sabung-notifications-${new Date().toISOString().slice(0, 10)}.json`,
  });
  link.click();
  URL.revokeObjectURL(link.href);
}
