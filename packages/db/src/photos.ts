// The record of a photo (PRD §12.1). The image files live in OPFS; records only point at a photo id.
import { eq } from "drizzle-orm";
import type { Db, Tx } from "./openDb";
import { photos } from "./schema";

export type PhotoRecord = { id: string; sizes: Record<string, { w: number; h: number }>; bytes: number; focalX: number; focalY: number };

export async function insertPhoto(db: Db | Tx, photo: Omit<PhotoRecord, "focalX" | "focalY"> & { focalX?: number; focalY?: number }) {
  await db.insert(photos).values({ focalX: 0.5, focalY: 0.5, ...photo }); // focal point: centre unless set (PRD §10.3)
}

export async function getPhoto(db: Db | Tx, id: string): Promise<PhotoRecord | undefined> {
  const [row] = await db.select().from(photos).where(eq(photos.id, id));
  return row && { id: row.id, sizes: row.sizes as PhotoRecord["sizes"], bytes: row.bytes ?? 0, focalX: row.focalX ?? 0.5, focalY: row.focalY ?? 0.5 };
}

export async function deletePhoto(db: Db | Tx, id: string) {
  await db.delete(photos).where(eq(photos.id, id));
}
