// The page's handle on the Worker. Created on first use, so the engine and PGlite stay out of
// the initial bundle (PRD §13: < 180 KB).
import * as Comlink from "comlink";
import type { WorkerApi } from "./worker";

let api: Comlink.Remote<WorkerApi> | undefined;

export function engine(): Comlink.Remote<WorkerApi> {
  api ??= Comlink.wrap<WorkerApi>(new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }));
  return api;
}

export const onProgress = <T>(callback: (value: T) => void) => Comlink.proxy(callback);
