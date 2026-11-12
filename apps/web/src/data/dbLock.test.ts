import { describe, expect, it } from "vitest";
import { holdDatabaseLock } from "./dbLock";

// A stand-in for navigator.locks: one exclusive holder per name, waiters queue, a signal gives up waiting.
function fakeLocks() {
  const queues = new Map<string, (() => void)[]>();
  const held = new Map<string, () => void>(); // name → release
  const grant = (name: string, callback: (lock: Lock | null) => unknown) => {
    let release!: () => void;
    const done = new Promise<void>((r) => { release = r; });
    held.set(name, release);
    Promise.resolve(callback({ name, mode: "exclusive" } as Lock)).finally(() => {});
    done.then(() => { held.delete(name); queues.get(name)?.shift()?.(); });
  };
  return {
    release: (name: string) => held.get(name)?.(), // the holder's Worker ends
    request: ((name: string, options: LockOptions, callback: (lock: Lock | null) => unknown) => new Promise<void>((resolve, reject) => {
      if (!held.has(name)) return resolve(void grant(name, callback));
      const waiter = () => resolve(void grant(name, callback));
      queues.set(name, [...(queues.get(name) ?? []), waiter]);
      options.signal?.addEventListener("abort", () => {
        queues.set(name, (queues.get(name) ?? []).filter((w) => w !== waiter));
        reject(new DOMException("Aborted", "AbortError"));
      });
    })) as LockManager["request"],
  };
}

describe("database lock (one tab at a time)", () => {
  it("the first tab gets the lock, a second tab does not", async () => {
    const locks = fakeLocks();
    expect(await holdDatabaseLock("sabung-idol", locks, 50)).toBe(true);
    expect(await holdDatabaseLock("sabung-idol", locks, 50)).toBe(false);
  });

  it("after a reload, waits for the closing page to let go instead of calling it another tab", async () => {
    const locks = fakeLocks();
    expect(await holdDatabaseLock("sabung-idol", locks, 50)).toBe(true);
    const reloaded = holdDatabaseLock("sabung-idol", locks, 1000);
    setTimeout(() => locks.release("sabung-db:sabung-idol"), 20); // the old Worker ends a moment later
    expect(await reloaded).toBe(true);
  });

  it("different databases do not block each other", async () => {
    const locks = fakeLocks();
    expect(await holdDatabaseLock("sabung-idol", locks, 50)).toBe(true);
    expect(await holdDatabaseLock("sabung-idol-devcheck", locks, 50)).toBe(true);
  });

  it("without Web Locks it does not block", async () => {
    expect(await holdDatabaseLock("sabung-idol", undefined)).toBe(true);
  });
});
