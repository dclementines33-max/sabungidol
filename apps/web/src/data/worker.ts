// The Web Worker (PRD §11, §13): engine and database run here so the screen never freezes.
// The page talks to it through Comlink (engineClient.ts).
import {
  type MatchFilter, type RatingChange, applyRatings, type BackupSection, type Branding, type Db, type ImportMode, type IssueFix, type NewEvent, startSeason, addIdols, countMatches, currentSeason, deleteBlocker, deleteIdol, getPhoto, idols, insertPhoto, leagueRosters, listCompetitions, listEvents, replaceInRoster, resetSeason, saveCompetition, setLeagueRosters, updateSeason,
  type IdolDetails, addGroup, listGroups, listIdols, updateIdolDetails,
  deletePhoto, logEvent, openDb, replaceTheIdols, resetStatistics, setGallery, theIdolsChanges, setGroupLogo, setPhotoFocal, saveMatches, seasons, setActive, setIdolPhoto, updateIdol,
} from "@sabung/db";
import { pickTheIdols, runSeason, splitLeagues, testSeason } from "@sabung/engine";
import * as Comlink from "comlink";
import { backupDue, exportBackup, importSabung, listSnapshots, readSnapshot, saveSnapshot } from "./backup/backupWorker";
import { fixIntegrity, integrityCheck } from "./integrityWorker";
import { acceptMatch, matchPreview } from "./singleMatch";
import { closePreview, saveProgression, startNewSeason } from "./seasonClose";
import { careerSync, lastSeasonProgression } from "./ratingSources";
import { careerStats, rebuildStats } from "./careerWorker";
import { seasonArchive } from "./archiveWorker";
import { storyOf } from "./storyWorker";
import { podiumOf } from "./honoursWorker";
import { awardsOf } from "./awardsWorker";
import { idolTelemetry } from "./idolTelemetryWorker";
import { telemetryOf } from "./telemetryWorker";
import { overview } from "./overviewWorker";
import { groupMatchupsOf, hallOfShameOf } from "./shameWorker";
import { type ArenaRead, arenaRead } from "./arenaWorker";
import { awardHistory, careerTable, titlesByComp, champions, headToHead, records, idolProfile, matchPage, seasonList } from "./wikiWorker";
import { type PlayProgress, type PlayTarget, cupView, leagueView, playSeason, requestPause, seasonOverview } from "./seasonRunner";
import { markOpened, resetIfRequested, wipeIfRequested } from "./databaseReset";
import { DB_IN_OTHER_TAB, holdDatabaseLock } from "./dbLock";
import { ensureFirstSeason } from "./firstSeason";
import { loadDefaultData } from "./loadDefaultData";
import { readPhotoFile, removePhotoFiles, storePhotoFiles } from "./photoFiles";
import { sha256, syncNow } from "./cloudSync";
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
  listIdols: async () => listIdols(await open()), listGroups: async () => listGroups(await open()),
  setGroupLogo: async (groupId: string, logoId: string | null) => setGroupLogo(await open(), groupId, logoId),
  addGroup: async (name: string) => addGroup(await open(), name),
  updateIdolDetails: async (rows: IdolDetails[], dryRun: boolean) => updateIdolDetails(await open(), rows, dryRun),
  setPhotoFocal: async (photoId: string, x: number, y: number) => setPhotoFocal(await open(), photoId, x, y),
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
    const idol = (await listIdols(db)).find((i) => i.id === id);
    const result = await deleteIdol(db, id);
    if (result.deleted) for (const photoId of [idol?.photoId, ...(idol?.gallery ?? [])]) if (photoId) await dropPhoto(db, photoId);
    return result;
  },
  // The idol's gallery becomes these images (the old gallery photos are removed). Returns the old ids to forget.
  setGallery: async (idolId: string, images: Blob[]) => {
    const db = await open();
    const ids: string[] = [];
    let old: string[];
    try {
      for (const image of images) ids.push((await keepPhoto(db, image)).id);
      old = await setGallery(db, idolId, ids);
    } catch (error) {
      for (const photoId of ids) await dropPhoto(db, photoId).catch(() => {}); // all or nothing: the old gallery stays
      throw error;
    }
    for (const photoId of old) await dropPhoto(db, photoId);
    return old;
  },
  // Adds photos to the idol's gallery (phones can't pick a folder); the photos already there stay. All or nothing.
  addGalleryPhotos: async (idolId: string, images: Blob[]) => {
    const db = await open();
    const existing = (await listIdols(db)).find((i) => i.id === idolId)?.gallery ?? [];
    const ids: string[] = [];
    try {
      for (const image of images) ids.push((await keepPhoto(db, image)).id);
      await setGallery(db, idolId, [...existing, ...ids]);
    } catch (error) {
      for (const photoId of ids) await dropPhoto(db, photoId).catch(() => {});
      throw error;
    }
  },
  // A new photo for an idol; the old one is removed. Returns both ids (the page forgets the old one's cached URLs).
  replacePhoto: async (idolId: string, image: Blob) => {
    const db = await open();
    const stored = await keepPhoto(db, image);
    const old = await setIdolPhoto(db, idolId, stored.id).catch(async (error) => { await dropPhoto(db, stored.id).catch(() => {}); throw error; });
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
  // Playing the season (Fase 3).
  startSeason: async () => {
    const db = await open();
    return startSeason(db, (await currentSeason(db))!.id, await theIdolsNow(db));
  },
  // The Idols "Sync rating" (Update 4): who would change, and the change itself (refused once IDL has a match).
  theIdolsChanges: async () => {
    const db = await open();
    return theIdolsChanges(db, (await currentSeason(db))!.id, await theIdolsNow(db));
  },
  syncTheIdols: async () => {
    const db = await open();
    return replaceTheIdols(db, (await currentSeason(db))!.id, await theIdolsNow(db));
  },
  seasonOverview: async () => seasonOverview(await open()),
  leagueView: async (comp: string) => leagueView(await open(), comp),
  cupView: async (comps: string[], seasonId?: string) => cupView(await open(), comps, seasonId),
  matchPreview: async (id: string) => matchPreview(await open(), id),
  acceptMatch: async (id: string, games: ("A" | "B")[], method: "sim" | "manual" | "wheel" | "marble", arenas?: string[]) => acceptMatch(await open(), id, games, method, arenas),
  playSeason: async (target: PlayTarget, onProgress: (p: PlayProgress) => void, arenas?: string[]) => playSeason(await open(), target, onProgress, arenas),
  pauseSeason: () => requestPause(),
  // Integrity check (PRD §14.2).
  integrityCheck: async () => integrityCheck(await open(), DATABASE),
  fixIntegrity: async (fix: IssueFix) => fixIntegrity(await open(), DATABASE, fix),
  // Backup & restore (PRD §12.3).
  exportBackup: async (section: BackupSection, seasonId?: string, cloud = false) => exportBackup(await open(), DATABASE, section, seasonId, true, cloud),
  previewImport: async (bytes: Uint8Array, mode: ImportMode) => importSabung(await open(), DATABASE, bytes, mode, true),
  applyImport: async (bytes: Uint8Array, mode: ImportMode) => importSabung(await open(), DATABASE, bytes, mode, false),
  saveSnapshot: async (reason: string) => saveSnapshot(await open(), DATABASE, reason),
  listSnapshots: async () => listSnapshots(DATABASE), readSnapshot: async (name: string) => readSnapshot(DATABASE, name),
  backupDue: async () => backupDue(await open()),
  // Rating Manager (PRD §6.4–6.6): proposals for the draft, then one save with rating_history.
  lastSeasonProgression: async () => lastSeasonProgression(await open()),
  careerSync: async (current: Record<string, number>, mode: "replace" | "blend") => careerSync(await open(), current, mode),
  applyRatings: async (changes: RatingChange[], source: string) => applyRatings(await open(), changes, source),
  // Career stats (PRD §7): cached per finished season, rebuildable from the matches.
  careerStats: async () => careerStats(await open()),
  arenaRead: async (kind: ArenaRead, args: unknown[]) => arenaRead(await open(), kind, args),
  rebuildStats: async () => rebuildStats(await open()),
  // Wiki pages (PRD §8).
  idolProfile: async (id: string) => idolProfile(await open(), id),
  careerTable: async (comp: string) => careerTable(await open(), comp),
  titlesByComp: async () => titlesByComp(await open()),
  seasonList: async () => seasonList(await open()),
  champions: async () => champions(await open()),
  records: async (minMatches: number) => records(await open(), minMatches),
  awardHistory: async () => awardHistory(await open()),
  seasonArchive: async (seasonId: string) => seasonArchive(await open(), seasonId),
  seasonStory: async (seasonId: string) => storyOf(await open(), seasonId),
  podiumDetail: async (seasonId: string, ids: string[]) => podiumOf(await open(), seasonId, ids),
  seasonAwards: async (seasonId: string) => awardsOf(await open(), seasonId),
  seasonTelemetry: async () => telemetryOf(await open()),
  idolTelemetry: async (id: string) => idolTelemetry(await open(), id),
  overview: async () => overview(await open()),
  headToHead: async (a?: string, b?: string) => headToHead(await open(), a, b),
  hallOfShame: async (minMatches: number) => hallOfShameOf(await open(), minMatches),
  groupMatchups: async (groupId: string) => groupMatchupsOf(await open(), groupId),
  matchPage: async (filter: MatchFilter, opts: { after?: string; limit?: number; newest?: boolean } = {}) => matchPage(await open(), filter, opts),
  // Closing the season (PRD §4, §6.3).
  closePreview: async () => closePreview(await open()),
  saveProgression: async () => saveProgression(await open()),
  startNewSeason: async () => {
    const db = await open();
    const state = await closePreview(db);
    if (state.blockers.length) return { ok: false as const, blockers: state.blockers };
    await saveSnapshot(db, DATABASE, "start new season");
    return startNewSeason(db);
  },
  // Danger Zone: the season back to a draft; with redraw the 12 leagues are split again too.
  // Reset statistik (Update 4): back to the setup as Season 1 draft; a snapshot first, like every dangerous action.
  resetStatistics: async () => {
    const db = await open();
    await saveSnapshot(db, DATABASE, "statistics reset");
    return resetStatistics(db);
  },
  resetSeason: async (seasonId: string, redraw: boolean) => {
    const db = await open();
    await saveSnapshot(db, DATABASE, "reset season"); // PRD §12.3: a snapshot before every dangerous action
    await resetSeason(db, seasonId);
    if (redraw) await setLeagueRosters(db, seasonId, splitLeagues((await listIdols(db)).filter((i) => i.active)).leagues);
  },

  // Photos (PRD §10.3, §12): files in OPFS, a record in the photos table; returns the photo id.
  cloudSync: async () => syncNow(await open(), DATABASE),
  savePhoto: async (image: Blob): Promise<string> => {
    const db = await open();
    return (await keepPhoto(db, image)).id;
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
    await db.insert(seasons).values({ id: "S01", number: 1, name: "Sample season", seed: input.seed, status: "live" }).onConflictDoNothing();

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

// The 20 highest-rated active idols right now (who The Idols would be).
async function theIdolsNow(db: Db) {
  const idols = (await listIdols(db)).map((i) => ({ id: i.id, groupId: i.groupId, rating: i.rating, active: i.active }));
  return pickTheIdols({ idols } as Parameters<typeof pickTheIdols>[0]);
}

// A photo nobody uses any more: its record, then its files (a leftover file is harmless, a missing one is not).
// Files plus their record; when the record can't be written (e.g. a full disk) the files go again: nothing half-written.
async function keepPhoto(db: Db, image: Blob) {
  const stored = await storePhotoFiles(DATABASE, image);
  try {
    await insertPhoto(db, { ...stored, hash: await sha256(await image.arrayBuffer()) }); // the hash cloud sync knows it by
  } catch (error) {
    await removePhotoFiles(DATABASE, stored.id).catch(() => {});
    throw error;
  }
  return stored;
}

async function dropPhoto(db: Db, photoId: string) {
  await deletePhoto(db, photoId);
  await removePhotoFiles(DATABASE, photoId).catch(() => {}); // cleaned later by the integrity check
}
