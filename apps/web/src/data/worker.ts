// The Web Worker (PRD §11, §13): engine and database run here so the screen never freezes.
// The page talks to it through Comlink (engineClient.ts).
import {
  type Db, type NewEvent, countMatches, idols, listEvents, logEvent, openDb, saveMatches, seasons,
} from "@sabung/db";
import { runSeason, testSeason } from "@sabung/engine";
import * as Comlink from "comlink";
import { type StorageKind, storageFor } from "./storageChoice";

export type Progress = { phase: "simulating" | "saving"; done: number; total: number };
export type SampleRun = { matches: number; inserted: number; simulateMs: number; saveMs: number; storage: StorageKind };

const PROGRESS_EVERY_MS = 100; // PRD §13: progress updates every 100 ms
// One database per Worker: its name is the Worker's name (engineClient.ts), and it is opened once.
const DATABASE = (self as unknown as { name: string }).name;
let database: Promise<Db> | undefined;
const open = () => (database ??= openDb(storageFor(DATABASE).dataDir));

const api = {
  storage: (): StorageKind => storageFor(DATABASE).storage,

  // Notification history (PRD §14.1).
  logEvent: async (event: NewEvent, options?: { oncePerDay?: boolean }) => logEvent(await open(), event, options),
  listEvents: async (limit?: number) => listEvents(await open(), limit),

  matchCount: async (): Promise<number> => countMatches(await open()),

  // Fase 1 check: simulate the sample season and save it, one round per transaction (PRD §13).
  async simulateSampleSeason(onProgress: (p: Progress) => void): Promise<SampleRun> {
    const db = await open();
    const input = testSeason();
    onProgress({ phase: "simulating", done: 0, total: 1 });
    const started = performance.now();
    const season = runSeason(input);
    const simulateMs = performance.now() - started;

    await db.insert(idols).values(input.idols.map((i) => ({ id: i.id, name: i.id, rating: i.rating }))).onConflictDoNothing();
    await db.insert(seasons).values({ id: "S01", number: 1, name: "Season contoh", seed: input.seed, status: "live" }).onConflictDoNothing();

    const rounds = new Map<string, typeof season.matches>();
    for (const m of season.matches) {
      const key = `${m.stage === "LG" ? "" : m.comp}-${m.round}`;
      rounds.set(key, [...(rounds.get(key) ?? []), m]);
    }
    let done = 0;
    let inserted = 0;
    let lastReport = 0;
    const saveStarted = performance.now();
    for (const batch of rounds.values()) {
      inserted += (await saveMatches(db, "S01", batch)).inserted;
      done += batch.length;
      if (performance.now() - lastReport >= PROGRESS_EVERY_MS || done === season.matches.length) {
        onProgress({ phase: "saving", done, total: season.matches.length });
        lastReport = performance.now();
      }
    }
    return { matches: season.matches.length, inserted, simulateMs, saveMs: performance.now() - saveStarted, storage: storageFor(DATABASE).storage };
  },
};

export type WorkerApi = typeof api;
Comlink.expose(api);
