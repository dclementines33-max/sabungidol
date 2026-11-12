// The page's handles on its Workers. Created on first use, so the engine and PGlite stay out of
// the initial bundle (PRD §13: < 180 KB). One Worker per database: a Worker can hold only one
// OPFS database (found in Fase 1 step 10 — a second one fails on its first query).
import * as Comlink from "comlink";
import { notify } from "./notices";
import { MAIN_DATABASE } from "./storageChoice";
import type { WorkerApi } from "./worker";

const workers = new Map<string, Comlink.Remote<WorkerApi>>();

export const WORKER_CRASH_MESSAGE =
  "Mesin simulasi berhenti mendadak. Match yang sudah tersimpan tetap aman; muat ulang halaman untuk melanjutkan.";

export function engine(database = MAIN_DATABASE): Comlink.Remote<WorkerApi> {
  if (!workers.has(database)) {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module", name: database });
    // PRD §14.2: a crashed Worker stops at its last finished transaction; tell the user, start fresh next time.
    worker.addEventListener("error", (event) => {
      workers.delete(database);
      notify({ level: "error", code: "E-WORKER-002", message: WORKER_CRASH_MESSAGE, context: event.message });
    });
    workers.set(database, Comlink.wrap<WorkerApi>(worker));
  }
  return workers.get(database)!;
}

export const onProgress = <T>(callback: (value: T) => void) => Comlink.proxy(callback);
