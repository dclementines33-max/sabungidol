// The Web Worker (PRD §11, §13): engine and database run here so the screen never freezes.
// The page talks to it through Comlink (engineClient.ts).
import {
  type Branding, type Db, type NewEvent, addIdols, countMatches, currentSeason, deleteBlocker, deleteIdol, getPhoto, idols, insertPhoto, leagueRosters, listCompetitions, listEvents, replaceInRoster, resetSeason, saveCompetition, setLeagueRosters, updateSeason,
  listGroups, listIdols,
  deletePhoto, logEvent, openDb, saveMatches, seasons, setActive, setIdolPhoto, updateIdol,
} from "@sabung/db";
import { runSeason, splitLeagues, testSeason } from "@sabung/engine";
import * as Comlink from "comlink";
import { markOpened, resetIfRequested, wipeIfRequested } from "./databaseReset";
import { DB_IN_OTHER_TAB, holdDatabaseLock } from "./dbLock";
import { ensureFirstSeason } from "./firstSeason";
import { loadDefaultData } from "./loadDefaultData";
import { readPhotoFile, removePhotoFiles, storePhotoFiles } from "./photoFiles";
import { type PhotoSizes, bestStored } from "./photoSizes";
import { type StorageKind, storageFor } from "./storageChoice";

export type Progress = { phase: "simulating" | "saving"; done: number; total: number };
export type SampleRun = { matches: number; inserted: number; simulateMs: number; saveMs: number; storage: StorageKind };

const PROGRESS_EVERY_MS = 100; // PRD §13: progress updates every 100 ms
// One database per Worker: its name is the Worker's name (engineClient.ts), and it is opened once.
const DATABASE = (self as unknown as { name: string }).name;
let database: Promise<Db> | undefined;
const open = () => (database ??= (async () => {
  if (!(await holdDatabaseLock(DATABASE))) throw new Error(`${DB_IN_OTHER_TAB}: ${DATABASE} is open in another tab`);
  const { dataDir, storage } = storageFor(DATABASE);
  if (storage !== "opfs") return openDb(dataDir);
  const root = await navigator.storage.getDirectory();
  await wipeIfRequested(root, DATABASE); // Danger Zone, after the user typed the confirmation
  await resetIfRequested(root, DATABASE); // only after the user confirmed it (databaseReset.ts)
  const db = await openDb(dataDir);
  await markOpened(root, DATABASE);
  return db;
})());

let defaultDataRun: ReturnType<typeof loadDefaultData> | undefined;
let firstSeasonRun: ReturnType<typeof ensureFirstSeason> | undefined;

const api = {
  storage: (): StorageKind => storageFor(DATABASE).storage,

  // Notification history (PRD §14.1).
  logEvent: async (event: NewEvent, options?: { oncePerDay?: boolean }) => logEvent(await open(), event, options),
  listEvents: async (limit?: number) => listEvents(await open(), limit),

  matchCount: async (): Promise<number> => countMatches(await open()),

  // Idols and groups (PRD §3, §8).
  listIdols: async () => listIdols(await open()),
  listGroups: async () => listGroups(await open()),
  addIdols: async (batch: Parameters<typeof addIdols>[1]) => addIdols(await open(), batch),
  updateIdol: async (id: string, input: Parameters<typeof updateIdol>[2]) => updateIdol(await open(), id, input),
  setActive: async (ids: string[], active: boolean) => setActive(await open(), ids, active),
  // Inactive Manager: deactivate, and give their league places to the chosen replacements, in one go.
  deactivate: async (ids: string[], replacements: Record<string, string>) => {
    const db = await open();
    const season = await currentSeason(db);
    await db.transaction(async (tx) => {
      await setActive(tx, ids, false);
      for (const [outId, inId] of Object.entries(replacements)) await replaceInRoster(tx, season!.id, outId, inId);
    });
  },
  // Why an idol cannot be deleted (matches, or a league roster), asked before the confirmation.
  deleteBlocker: async (id: string) => deleteBlocker(await open(), id),
  // Deleting also removes the idol's photo (its record and files).
  deleteIdol: async (id: string) => {
    const db = await open();
    const photoId = (await listIdols(db)).find((i) => i.id === id)?.photoId;
    const result = await deleteIdol(db, id);
    if (result.deleted && photoId) await dropPhoto(db, photoId);
    return result;
  },
  // A new photo for an idol; the old one is removed. Returns both ids (the page forgets the old one's cached URLs).
  replacePhoto: async (idolId: string, image: Blob) => {
    const db = await open();
    const stored = await storePhotoFiles(DATABASE, image);
    await insertPhoto(db, stored);
    const old = await setIdolPhoto(db, idolId, stored.id);
    if (old) await dropPhoto(db, old);
    return { photoId: stored.id, old };
  },

  // The default idol data, once per database (shared promise: a double start loads it only once).
  loadDefaultData: async () => (defaultDataRun ??= open().then((db) => loadDefaultData(db, DATABASE))),

  // Seasons (PRD §12.1).
  ensureFirstSeason: async () => (firstSeasonRun ??= open().then(ensureFirstSeason)),
  currentSeason: async () => currentSeason(await open()),
  leagueRosters: async (seasonId: string) => leagueRosters(await open(), seasonId),
  // Settings (PRD §8).
  updateSeason: async (id: string, change: { name?: string; config?: unknown }) => updateSeason(await open(), id, change),
  setLeagueRosters: async (seasonId: string, leagues: Record<string, string[]>) => setLeagueRosters(await open(), seasonId, leagues),
  listCompetitions: async (seasonId: string) => listCompetitions(await open(), seasonId),
  saveCompetition: async (seasonId: string, code: string, name: string, branding: Branding) => saveCompetition(await open(), seasonId, code, name, branding),
  // Data Maker: how the active idols would be split now (nothing saved).
  previewSplit: async () => splitLeagues((await listIdols(await open())).filter((i) => i.active)),
  // Danger Zone: the season back to a draft; with redraw the 12 leagues are split again too.
  resetSeason: async (seasonId: string, redraw: boolean) => {
    const db = await open();
    await resetSeason(db, seasonId);
    if (redraw) await setLeagueRosters(db, seasonId, splitLeagues((await listIdols(db)).filter((i) => i.active)).leagues);
  },

  // Photos (PRD §10.3, §12): files in OPFS, a record in the photos table; returns the photo id.
  savePhoto: async (image: Blob): Promise<string> => {
    const db = await open();
    const stored = await storePhotoFiles(DATABASE, image);
    await insertPhoto(db, stored);
    return stored.id;
  },
  // The best stored file for a wanted size (never a blown-up copy); null when the photo is unknown.
  photoBlob: async (photoId: string, size: number): Promise<Blob | null> => {
    const record = await getPhoto(await open(), photoId);
    if (!record) return null;
    const sizes = record.sizes as PhotoSizes;
    return readPhotoFile(DATABASE, photoId, bestStored(sizes, size), sizes);
  },

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

// A photo nobody uses any more: its record, then its files (a leftover file is harmless, a missing one is not).
async function dropPhoto(db: Db, photoId: string) {
  await deletePhoto(db, photoId);
  await removePhotoFiles(DATABASE, photoId).catch(() => {}); // cleaned later by the integrity check
}
