import { afterEach, describe, expect, it, vi } from "vitest";
import { askPersistentStorage } from "./persistentStorage";

afterEach(() => vi.unstubAllGlobals());
const withStorage = (storage: unknown) => vi.stubGlobal("navigator", { storage });

describe("askPersistentStorage (PRD §12)", () => {
  it("does not ask again when already persisted", async () => {
    const persist = vi.fn();
    withStorage({ persisted: async () => true, persist });
    expect(await askPersistentStorage()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });
  it("reports a refusal", async () => {
    withStorage({ persisted: async () => false, persist: async () => false });
    expect(await askPersistentStorage()).toBe(false);
  });
  it("is null when the browser has no such API or it throws", async () => {
    withStorage(undefined);
    expect(await askPersistentStorage()).toBeNull();
    withStorage({ persisted: async () => false, persist: async () => { throw new Error("blocked"); } });
    expect(await askPersistentStorage()).toBeNull();
  });
});
