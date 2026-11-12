// The page's handles on its Workers. Created on first use, so the engine and PGlite stay out of
// the initial bundle (PRD §13: < 180 KB). One Worker per database: a Worker can hold only one
// OPFS database (found in Fase 1 step 10 — a second one fails on its first query).
import * as Comlink from "comlink";
import { MAIN_DATABASE } from "./storageChoice";
import type { WorkerApi } from "./worker";

const workers = new Map<string, Comlink.Remote<WorkerApi>>();

export function engine(database = MAIN_DATABASE): Comlink.Remote<WorkerApi> {
  if (!workers.has(database)) {
    workers.set(database, Comlink.wrap<WorkerApi>(new Worker(new URL("./worker.ts", import.meta.url), { type: "module", name: database })));
  }
  return workers.get(database)!;
}

export const onProgress = <T>(callback: (value: T) => void) => Comlink.proxy(callback);
