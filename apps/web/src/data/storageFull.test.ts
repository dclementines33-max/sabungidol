import { beforeEach, expect, it } from "vitest";
import { notify, useNotices } from "./notices";
import { STORAGE_FULL, isStorageFull } from "./storageFull";

beforeEach(() => useNotices.setState({ notices: [], unread: 0, toasts: [], pinned: [], blocker: null, persister: null }));

it("knows a full disk from the browser, OPFS and Postgres error texts, and nothing else", () => {
  expect(isStorageFull("QuotaExceededError: The quota has been exceeded.")).toBe(true);
  expect(isStorageFull("The quota has been exceeded.")).toBe(true);
  expect(isStorageFull('could not extend file "base/5/16384": No space left on device')).toBe(true);
  expect(isStorageFull("ErrnoError: errno 28 ENOSPC")).toBe(true);
  expect(isStorageFull("Match S01-D1A-LG-MD01-M01 has already been played.")).toBe(false);
  expect(isStorageFull(undefined)).toBe(false);
});

it("a save that failed on a full disk becomes one W-STORAGE-003 warning, however many writes failed", () => {
  for (const name of ["a.jpg", "b.jpg"]) notify({ level: "error", code: "E-PHOTO-002", message: `Photo ${name} couldn't be saved.`, context: "QuotaExceededError: The quota has been exceeded." });
  const { pinned, notices } = useNotices.getState();
  expect(pinned.map((p) => [p.level, p.code])).toEqual([["warning", STORAGE_FULL]]);
  expect(notices).toHaveLength(1);
  expect(pinned[0]!.context).toContain("E-PHOTO-002");
  notify({ level: "error", code: "E-PLAY-001", message: "Simulation stopped.", context: "boom" }); // other errors stay as they are
  expect(useNotices.getState().pinned.map((p) => p.code)).toEqual([STORAGE_FULL, "E-PLAY-001"]);
});
