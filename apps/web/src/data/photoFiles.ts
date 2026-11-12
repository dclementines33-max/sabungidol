// Photo image files in OPFS (PRD §12): <database>-photos/<photoId>/{orig, 64, 256, 1024}.
// Runs in the Worker: decoding and resizing happen off the main thread (PRD §13).
// Writes use sync access handles, which every OPFS browser supports inside a Worker.
import { ulid } from "@sabung/shared";
import { type PhotoSizes, type StoredFile, fitWithin, sizesToMake } from "./photoSizes";

const folder = async (database: string, photoId: string, create: boolean) => {
  const root = await navigator.storage.getDirectory();
  const base = await root.getDirectoryHandle(`${database}-photos`, { create });
  return base.getDirectoryHandle(photoId, { create });
};

// The DOM type library leaves this Worker-only API out; only the parts used here.
type SyncAccess = { truncate(size: number): void; write(data: Uint8Array, options: { at: number }): number; flush(): void; close(): void };

async function writeFile(dir: FileSystemDirectoryHandle, name: string, blob: Blob) {
  const handle = await dir.getFileHandle(name, { create: true });
  const access = await (handle as unknown as { createSyncAccessHandle(): Promise<SyncAccess> }).createSyncAccessHandle();
  try {
    access.truncate(0);
    access.write(new Uint8Array(await blob.arrayBuffer()), { at: 0 });
    access.flush();
  } finally {
    access.close();
  }
}

// Stores the original and the smaller WebP copies; never enlarges. Returns what the photo record needs.
export async function storePhotoFiles(database: string, image: Blob) {
  const bitmap = await createImageBitmap(image);
  try {
    const id = ulid();
    const dir = await folder(database, id, true);
    const sizes: PhotoSizes = { orig: { w: bitmap.width, h: bitmap.height, type: image.type || "image/webp" } };
    await writeFile(dir, "orig", image);
    let bytes = image.size;
    for (const max of sizesToMake(bitmap.width, bitmap.height)) {
      const { w, h } = fitWithin(bitmap.width, bitmap.height, max);
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, w, h);
      const copy = await canvas.convertToBlob({ type: "image/webp", quality: 0.85 });
      await writeFile(dir, String(max), copy);
      sizes[String(max) as StoredFile] = { w, h };
      bytes += copy.size;
    }
    return { id, sizes, bytes };
  } finally {
    bitmap.close();
  }
}

export async function readPhotoFile(database: string, photoId: string, file: StoredFile, sizes: PhotoSizes): Promise<Blob> {
  const data = await (await (await folder(database, photoId, false)).getFileHandle(file)).getFile();
  return new Blob([data], { type: file === "orig" ? (sizes.orig?.type ?? "image/webp") : "image/webp" });
}

export async function removePhotoFiles(database: string, photoId: string) {
  const root = await navigator.storage.getDirectory();
  await (await root.getDirectoryHandle(`${database}-photos`)).removeEntry(photoId, { recursive: true });
}
