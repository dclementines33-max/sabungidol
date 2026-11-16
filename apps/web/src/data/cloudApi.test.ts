import { afterEach, expect, it, vi } from "vitest";
import { uploadCloudBackup } from "./cloudApi";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it("a 45 MB backup goes up as 20 + 20 + 5 MB parts (a dropped part is tried again), then one call records it", async () => {
  vi.useFakeTimers();
  const calls: { url: string; method: string; size: number }[] = [];
  let failedOnce = false;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith("/1") && !failedOnce) { failedOnce = true; throw new TypeError("network"); }
    calls.push({ url, method: init.method!, size: (init.body as Uint8Array | undefined)?.byteLength ?? 0 });
    return new Response(JSON.stringify({ id: "x" }), { status: 201 });
  }));
  const MB = 1024 * 1024;
  const sent: number[] = [];
  const done = uploadCloudBackup(new Uint8Array(45 * MB), "sabung-base-2026-11-16.sabung", (s) => sent.push(s));
  await vi.runAllTimersAsync();
  await done;
  expect(calls.map((c) => [c.method, c.size / MB])).toEqual([["PUT", 20], ["PUT", 20], ["PUT", 5], ["POST", 0]]);
  const upload = /upload\/([^/]+)\/0$/.exec(calls[0]!.url)![1];
  expect(calls.slice(0, 3).every((c) => c.url.includes(`/api/backups/upload/${upload}/`))).toBe(true);
  expect(calls[3]!.url).toBe(`/api/backups/upload/${upload}?name=sabung-base-2026-11-16.sabung&parts=3&size=${45 * MB}`);
  expect(sent.map((s) => s / MB)).toEqual([20, 40, 45]);
});
