import type { LoggedEvent, NewEvent } from "@sabung/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notify, useNotices } from "./notices";

// A fake event_log in memory instead of the Worker.
let log: LoggedEvent[] = [];
const persister = {
  log: vi.fn(async (e: NewEvent, o?: { oncePerDay?: boolean }) => {
    if (o?.oncePerDay && log.some((x) => x.code === e.code)) return null;
    const row: LoggedEvent = { id: log.length + 1, level: e.level, message: e.message, code: e.code ?? null, context: e.context ?? null, at: new Date().toISOString() };
    log.unshift(row);
    return row;
  }),
  list: async () => log,
};

beforeEach(() => {
  log = [];
  persister.log.mockClear();
  useNotices.setState({ notices: [], unread: 0, toasts: [], pinned: [], blocker: null, persister });
});
const flush = () => new Promise((r) => setTimeout(r, 0));
const state = () => useNotices.getState();

describe("notification store (PRD §14.1)", () => {
  it("routes each level to its place and counts unread", () => {
    notify({ level: "info", message: "Matchday 12 selesai di 13 leagues" });
    notify({ level: "warning", code: "W-ROSTER", message: "Mina ada di dua leagues" });
    notify({ level: "blocker", message: "Start New Season diblokir: Nugu Cup belum selesai (R6)" });
    notify({ level: "error", code: "E-DRAW-002", message: "Group H hanya 3 idol" });
    expect(state().toasts.map((n) => n.level)).toEqual(["info"]);
    expect(state().pinned.map((n) => n.level)).toEqual(["warning", "error"]);
    expect(state().blocker?.message).toContain("diblokir");
    expect(state().unread).toBe(4);
    state().markRead();
    expect(state().unread).toBe(0);
  });

  it("writes every notice to event_log and takes over its id", async () => {
    notify({ level: "success", message: "240 idol ditambahkan", undo: () => {} });
    await flush();
    expect(persister.log).toHaveBeenCalledWith(expect.not.objectContaining({ undo: expect.anything() }), undefined);
    expect(state().notices[0].id).toBe("log-1");
  });

  it("loading history adds earlier visits without showing anything twice", async () => {
    notify({ level: "info", message: "baru" });
    await flush();
    log.push({ id: 0, level: "error", message: "lama", code: "E-1", context: null, at: "2026-11-01T10:00:00.000Z" });
    await state().loadHistory();
    expect(state().notices.map((n) => n.message)).toEqual(["baru", "lama"]);
  });

  it("a repeating coded warning is pinned once and logged once a day", async () => {
    const warning = { level: "warning" as const, code: "W-STORAGE-001", message: "Izin penyimpanan ditolak" };
    notify(warning, { oncePerDay: true });
    await flush();
    notify(warning, { oncePerDay: true });
    await flush();
    expect(state().pinned).toHaveLength(1);
    expect(log).toHaveLength(1);
  });

  it("a skipped repeat is not listed twice once the history loads", async () => {
    const warning = { level: "warning" as const, code: "W-STORAGE-001", message: "Izin penyimpanan ditolak" };
    log.push({ id: 9, level: "warning", message: warning.message, code: warning.code, context: null, at: "2026-11-13T08:00:00.000Z" });
    notify(warning, { oncePerDay: true });
    await flush();
    await state().loadHistory();
    expect(state().notices.filter((n) => n.code === "W-STORAGE-001")).toHaveLength(1);
    expect(state().pinned).toHaveLength(1);
    expect(state().unread).toBe(0);
  });

  it("log: false shows a notice without writing it to event_log again", async () => {
    notify({ level: "success", message: "242 default idols loaded" }, { log: false });
    await flush();
    expect(state().toasts).toHaveLength(1);
    expect(state().notices[0].message).toContain("242 default idols");
    expect(persister.log).not.toHaveBeenCalled();
  });

  it("closing a pinned notice and the blocker", () => {
    notify({ level: "warning", message: "x" });
    notify({ level: "blocker", message: "y" });
    state().unpin(state().pinned[0].id);
    state().closeBlocker();
    expect(state().pinned).toEqual([]);
    expect(state().blocker).toBeNull();
  });
});
