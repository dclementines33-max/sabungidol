import { describe, expect, it } from "vitest";
import { openFirstTimeSafely } from "./firstOpen";

// A stand-in for the OPFS root: a set of entry names (directories end with "/").
function fakeRoot(entries: string[]) {
  const names = new Set(entries);
  const find = (name: string, create = false) => {
    if (create) names.add(name);
    return names.has(name) ? Promise.resolve({ name }) : Promise.reject(new DOMException("missing", "NotFoundError"));
  };
  return {
    names,
    getFileHandle: ((name: string, options?: { create?: boolean }) => find(name, options?.create)) as never,
    getDirectoryHandle: ((name: string) => find(`${name}/`)) as never,
    removeEntry: (async (name: string) => {
      if (!names.delete(name) && !names.delete(`${name}/`)) throw new DOMException("missing", "NotFoundError");
    }) as never,
  };
}

// Opening "creates" the database directory, like PGlite does.
const opener = (root: ReturnType<typeof fakeRoot>, fail = false) => async () => {
  root.names.add("db/");
  if (fail) throw new Error("page closed");
  return "db";
};

describe("first open of an OPFS database", () => {
  it("a new database: marked while it is made, unmarked once it opens", async () => {
    const root = fakeRoot([]);
    expect(await openFirstTimeSafely(root, "db", opener(root))).toBe("db");
    expect([...root.names]).toEqual(["db/"]);
  });

  it("an interrupted first creation is cleared and made again", async () => {
    const root = fakeRoot([]);
    await expect(openFirstTimeSafely(root, "db", opener(root, true))).rejects.toThrow();
    expect(root.names.has("db.creating")).toBe(true); // what the next start finds
    let cleared = false;
    expect(await openFirstTimeSafely(root, "db", async () => { cleared = !root.names.has("db/"); root.names.add("db/"); return "db"; })).toBe("db");
    expect(cleared).toBe(true);
    expect([...root.names]).toEqual(["db/"]);
  });

  it("waits while the closing page still holds the files, and gives up after the wait", async () => {
    const busy = (root: ReturnType<typeof fakeRoot>, times: number) => {
      const remove = root.removeEntry as unknown as (name: string) => Promise<void>;
      root.removeEntry = (async (name: string) => {
        if (name === "db" && times-- > 0) throw new DOMException("in use", "NoModificationAllowedError");
        return remove(name);
      }) as never;
    };
    const soonFree = fakeRoot(["db/", "db.creating"]);
    busy(soonFree, 2);
    expect(await openFirstTimeSafely(soonFree, "db", async () => { expect(soonFree.names.has("db/")).toBe(false); return "db"; }, 1000)).toBe("db");

    const stuck = fakeRoot(["db/", "db.creating"]);
    busy(stuck, Infinity);
    await expect(openFirstTimeSafely(stuck, "db", async () => "db", 150)).rejects.toThrow("in use");
    expect(stuck.names.has("db.creating")).toBe(true); // the next start tries again
  });

  it("an existing database without the marker is never cleared", async () => {
    const root = fakeRoot(["db/"]);
    let opens = 0;
    await openFirstTimeSafely(root, "db", async () => { opens++; return "db"; });
    expect(opens).toBe(1);
    expect([...root.names]).toEqual(["db/"]);
  });
});
