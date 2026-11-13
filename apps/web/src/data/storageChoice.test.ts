import { describe, expect, it } from "vitest";
import { isSafari, storageFor, supportsOpfs } from "./storageChoice";

describe("storage choice (Fase 1 step 9 decision)", () => {
  it("uses OPFS when the browser supports it, IndexedDB otherwise", () => {
    expect(storageFor("sabung-idol", true)).toEqual({ dataDir: "opfs-ahp://sabung-idol", storage: "opfs" });
    expect(storageFor("sabung-idol", false)).toEqual({ dataDir: "idb://sabung-idol", storage: "indexeddb" });
  });
  it("a place without OPFS sync handles (like this test runner) is not counted as OPFS", () => {
    expect(supportsOpfs()).toBe(false);
  });
  it("Safari / WebKit gets IndexedDB (its sync-handle cap is below what PGlite needs); Chromium does not", () => {
    expect(isSafari("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15")).toBe(true);
    expect(isSafari("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(isSafari("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")).toBe(false);
    expect(isSafari("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0")).toBe(false);
    expect(isSafari("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0")).toBe(false);
  });
});
