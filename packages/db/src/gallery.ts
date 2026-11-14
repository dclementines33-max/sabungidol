// An idol's gallery: extra photos shown beside the MatchModal. The list is replaced as a whole (a folder
// import is the source); returns the photo ids that left, so the caller can delete their records and files.
import { eq } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { idols } from "./schema";

export async function setGallery(db: Db | Tx, idolId: string, photoIds: string[]): Promise<string[]> {
  const [row] = await db.select({ gallery: idols.gallery }).from(idols).where(eq(idols.id, idolId));
  if (!row) throw new Error(`Unknown idol ${idolId}`);
  await db.update(idols).set({ gallery: photoIds }).where(eq(idols.id, idolId));
  return row.gallery.filter((id) => !photoIds.includes(id));
}
