import { describe, expect, it } from "vitest";
import { storageFor, supportsOpfs } from "./storageChoice";

describe("storage choice (Fase 1 step 9 decision)", () => {
  it("uses OPFS when the browser supports it, IndexedDB otherwise", () => {
    expect(storageFor("sabung-idol", true)).toEqual({ dataDir: "opfs-ahp://sabung-idol", storage: "opfs" });
    expect(storageFor("sabung-idol", false)).toEqual({ dataDir: "idb://sabung-idol", storage: "indexeddb" });
  });
  it("a place without OPFS sync handles (like this test runner) is not counted as OPFS", () => {
    expect(supportsOpfs()).toBe(false);
  });
});
