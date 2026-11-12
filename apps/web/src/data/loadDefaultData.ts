// Loads seed/idols.json into a new database (user decision: every fresh install starts with it).
// Runs in the Worker. Photo files go to OPFS first; then photo records, groups and idols are saved in
// ONE transaction, so a tab closed halfway leaves the database empty and the next start tries again.
// Done once per database: a logged I-SEED-001 means "already loaded", even if the idols were deleted since.
import { type Db, addIdols, insertPhoto, listEvents, listIdols, logEvent } from "@sabung/db";
import seedUrl from "../../../../seed/idols.json?url";
import { storePhotoFiles } from "./photoFiles";
import { seedIdols } from "./seedData";

export const SEED_LOADED = "I-SEED-001";

export async function loadDefaultData(db: Db, database: string): Promise<{ loaded: number; refused: number } | null> {
  const log = await listEvents(db, 10_000);
  // Also skip when idols already exist: the tab may have closed after saving but before the marker was logged.
  if (log.some((e) => e.code === SEED_LOADED) || (await listIdols(db)).length > 0) return null;

  const idols = seedIdols(await (await fetch(seedUrl)).json());
  // shortcut: if the transaction below fails, these files stay without records; the Fase 2 integrity check removes orphans.
  const photos: Awaited<ReturnType<typeof storePhotoFiles>>[] = [];
  for (const idol of idols) photos.push(await storePhotoFiles(database, await (await fetch(idol.photo)).blob()));

  const result = await db.transaction(async (tx) => {
    for (const photo of photos) await insertPhoto(tx, photo);
    return addIdols(tx, idols.map((idol, i) => ({
      name: idol.name, groupName: idol.groupName, rating: idol.rating, seed: null, nationality: null, birthday: null, photoId: photos[i].id,
    })));
  });
  await logEvent(db, { level: "success", code: SEED_LOADED, message: `${result.added.length} idol dari data bawaan dimuat` });
  return { loaded: result.added.length, refused: result.refused.length };
}
