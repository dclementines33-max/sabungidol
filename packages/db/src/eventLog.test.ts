import { beforeEach, describe, expect, it } from "vitest";
import { listEvents, logEvent } from "./eventLog";
import { type Db, openDb } from "./openDb";

let db: Db;
beforeEach(async () => {
  db = await openDb();
});

describe("event log (PRD §14.1)", () => {
  it("writes an event and lists newest first", async () => {
    await logEvent(db, { level: "info", message: "Matchday 1 selesai" });
    const error = await logEvent(db, { level: "error", code: "E-DRAW-002", message: "Group H hanya 3 idol", context: { group: "H" } });
    expect(error).toMatchObject({ level: "error", code: "E-DRAW-002", context: { group: "H" } });
    expect(new Date(error!.at).getTime()).toBeGreaterThan(0);
    expect((await listEvents(db)).map((e) => e.message)).toEqual(["Group H hanya 3 idol", "Matchday 1 selesai"]);
  });

  it("oncePerDay skips a coded event already written today", async () => {
    const warning = { level: "warning" as const, code: "W-STORAGE-001", message: "Izin penyimpanan ditolak" };
    expect(await logEvent(db, warning, { oncePerDay: true })).not.toBeNull();
    expect(await logEvent(db, warning, { oncePerDay: true })).toBeNull();
    expect(await logEvent(db, { ...warning, code: "W-OTHER" }, { oncePerDay: true })).not.toBeNull();
    expect(await listEvents(db)).toHaveLength(2);
  });

  it("without oncePerDay every event is written", async () => {
    await logEvent(db, { level: "info", code: "I-1", message: "a" });
    await logEvent(db, { level: "info", code: "I-1", message: "a" });
    expect(await listEvents(db)).toHaveLength(2);
  });

  it("limits the list", async () => {
    for (let i = 0; i < 5; i++) await logEvent(db, { level: "info", message: `m${i}` });
    expect((await listEvents(db, 3)).map((e) => e.message)).toEqual(["m4", "m3", "m2"]);
  });
});
