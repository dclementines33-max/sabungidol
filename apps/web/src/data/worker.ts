// The Web Worker (PRD §11, §13): engine and database run here so the screen never freezes.
// The page talks to it through Comlink (engineClient.ts).
import { countMatches, idols, openDb, saveMatches, seasons, type Db } from "@sabung/db";
import { runSeason, testSeason } from "@sabung/engine";
import * as Comlink from "comlink";
import { type StorageKind, storageFor } from "./storageChoice";

export type Progress = { phase: "simulating" | "saving"; done: number; total: number };
export type SampleRun = { matches: number; inserted: number; simulateMs: number; saveMs: number; storage: StorageKind };

const PROGRESS_EVERY_MS = 100; // PRD §13: progress updates every 100 ms
// database = a name, e.g. "sabung-idol"; where it lives is decided by storageFor.
const databases = new Map<string, Promise<Db>>();
const open = (database: string) => {
  if (!databases.has(database)) databases.set(database, openDb(storageFor(database).dataDir));
  return databases.get(database)!;
};

const api = {
  storage: (): StorageKind => storageFor("").storage,

  async matchCount(database: string): Promise<number> {
    return countMatches(await open(database));
  },

  // Fase 1 check: simulate the sample season and save it, one round per transaction (PRD §13).
  async simulateSampleSeason(database: string, onProgress: (p: Progress) => void): Promise<SampleRun> {
    const db = await open(database);
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
    return { matches: season.matches.length, inserted, simulateMs, saveMs: performance.now() - saveStarted, storage: storageFor(database).storage };
  },
};

export type WorkerApi = typeof api;
Comlink.expose(api);
