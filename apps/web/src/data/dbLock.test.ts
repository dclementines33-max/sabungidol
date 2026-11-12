import { describe, expect, it } from "vitest";
import { holdDatabaseLock } from "./dbLock";

// A stand-in for navigator.locks with ifAvailable: the first holder keeps the lock.
function fakeLocks() {
  const held = new Set<string>();
  return {
    request: ((name: string, _options: LockOptions, callback: (lock: Lock | null) => unknown) => {
      const free = !held.has(name);
      if (free) held.add(name);
      return Promise.resolve(callback(free ? ({ name, mode: "exclusive" } as Lock) : null));
    }) as LockManager["request"],
  };
}

describe("database lock (one tab at a time)", () => {
  it("the first tab gets the lock, a second tab does not", async () => {
    const locks = fakeLocks();
    expect(await holdDatabaseLock("sabung-idol", locks)).toBe(true);
    expect(await holdDatabaseLock("sabung-idol", locks)).toBe(false);
  });

  it("different databases do not block each other", async () => {
    const locks = fakeLocks();
    expect(await holdDatabaseLock("sabung-idol", locks)).toBe(true);
    expect(await holdDatabaseLock("sabung-idol-devcheck", locks)).toBe(true);
  });

  it("without Web Locks it does not block", async () => {
    expect(await holdDatabaseLock("sabung-idol", undefined)).toBe(true);
  });
});
