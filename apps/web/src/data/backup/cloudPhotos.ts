// Photos in the cloud (user, 2026-11-16): never the multi-MB original when a 1024 copy exists — the app shows nothing
// bigger (bestStored), and the cloud has 1 GB in all. A photo of 1024 px or less keeps its original (its only big file).
import type { PhotoSizes, StoredFile } from "../photoSizes";
import type { PhotoFiles } from "./sabungFile";

export const cloudFile = (sizes: PhotoSizes): StoredFile => (sizes["1024"] ? "1024" : "orig");

// A cloud backup's photos: the original left out where a 1024 copy stands in, and dropped from the record too, so a
// restored device never asks for a file it doesn't have.
export function withoutOriginals(rows: Record<string, unknown>[], files: PhotoFiles) {
  const out: PhotoFiles = { ...files };
  const photos = rows.map((row) => {
    const sizes = (row.sizes ?? {}) as PhotoSizes;
    if (cloudFile(sizes) !== "1024") return row;
    delete out[`${row.id as string}/orig`];
    const { orig: _orig, ...rest } = sizes;
    return { ...row, sizes: rest };
  });
  return { photos, files: out };
}
