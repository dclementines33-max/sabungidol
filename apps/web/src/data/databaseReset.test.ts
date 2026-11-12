import { describe, expect, it } from "vitest";
import { markOpened, neverOpened, requestReset, resetIfRequested } from "./databaseReset";

// A stand-in for the OPFS root: entry names, directories end with "/".
function fakeRoot(entries: string[], busyTimes = 0) {
  const names = new Set(entries);
  return {
    names,
    getFileHandle: (async (name: string, options?: { create?: boolean }) => {
      if (options?.create) names.add(name);
      if (!names.has(name)) throw new DOMException("missing", "NotFoundError");
      return { name };
    }) as never,
    removeEntry: (async (name: string) => {
      if (name === "db" && busyTimes-- > 0) throw new DOMException("in use", "NoModificationAllowedError");
      if (!names.delete(name) && !names.delete(`${name}/`)) throw new DOMException("missing", "NotFoundError");
    }) as never,
  };
}

describe("database reset (only with the user's yes, never after a successful open)", () => {
  it("a database that has opened is marked, and is no longer 'never opened'", async () => {
    const root = fakeRoot(["db/"]);
    expect(await neverOpened(root, "db")).toBe(true);
    await markOpened(root, "db");
    expect(await neverOpened(root, "db")).toBe(false);
  });

  it("does nothing without a request", async () => {
    const root = fakeRoot(["db/", "db-photos/"]);
    expect(await resetIfRequested(root, "db")).toBe(false);
    expect([...root.names]).toEqual(["db/", "db-photos/"]);
  });

  it("with a request, deletes a never-opened database and its photos, waiting for busy files", async () => {
    const root = fakeRoot(["db/", "db-photos/", "other/"], 2);
    await requestReset(root, "db");
    expect(await resetIfRequested(root, "db", 1000)).toBe(true);
    expect([...root.names]).toEqual(["other/"]);
  });

  it("never deletes a database that has opened, even with a request", async () => {
    const root = fakeRoot(["db/", "db-photos/", "db.ready"]);
    await requestReset(root, "db");
    expect(await resetIfRequested(root, "db")).toBe(false);
    expect([...root.names]).toEqual(["db/", "db-photos/", "db.ready"]);
  });

  it("gives up while the files stay busy, and keeps the request for the next start", async () => {
    const root = fakeRoot(["db/"], Infinity);
    await requestReset(root, "db");
    await expect(resetIfRequested(root, "db", 150)).rejects.toThrow("in use");
    expect(root.names.has("db.reset")).toBe(true);
  });
});
