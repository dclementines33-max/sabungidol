// The record of a photo (PRD §12.1). The image files live in OPFS; records only point at a photo id.
import { eq, inArray } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { idols, photos } from "./schema";

export type PhotoRecord = { id: string; sizes: Record<string, { w: number; h: number }>; bytes: number; focalX: number; focalY: number };

export async function insertPhoto(db: Db | Tx, photo: Omit<PhotoRecord, "focalX" | "focalY"> & { focalX?: number; focalY?: number; hash?: string | null }) {
  await db.insert(photos).values({ focalX: 0.5, focalY: 0.5, ...photo }); // focal point: centre unless set (PRD §10.3)
}

export async function getPhoto(db: Db | Tx, id: string): Promise<PhotoRecord | undefined> {
  const [row] = await db.select().from(photos).where(eq(photos.id, id));
  return row && { id: row.id, sizes: row.sizes as PhotoRecord["sizes"], bytes: row.bytes ?? 0, focalX: row.focalX ?? 0.5, focalY: row.focalY ?? 0.5 };
}

// Where the portrait crop centres (0–1 across, 0–1 down), set by the user (PRD §10.3).
export async function setPhotoFocal(db: Db | Tx, id: string, focalX: number, focalY: number) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  await db.update(photos).set({ focalX: clamp(focalX), focalY: clamp(focalY) }).where(eq(photos.id, id));
}

export async function deletePhoto(db: Db | Tx, id: string) {
  await db.delete(photos).where(eq(photos.id, id));
}

// Photo records whose files are gone (integrity "Perbaiki"): the idols show their initials again.
export async function forgetPhotos(db: Db, ids: string[]) {
  if (!ids.length) return;
  await db.transaction(async (tx) => {
    await tx.update(idols).set({ photoId: null }).where(inArray(idols.photoId, ids));
    for (const row of await tx.select({ id: idols.id, gallery: idols.gallery }).from(idols)) { // and out of every gallery
      const kept = row.gallery.filter((id) => !ids.includes(id));
      if (kept.length !== row.gallery.length) await tx.update(idols).set({ gallery: kept }).where(eq(idols.id, row.id));
    }
    await tx.delete(photos).where(inArray(photos.id, ids));
  });
}
