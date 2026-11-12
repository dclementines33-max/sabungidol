// Photo sizes (PRD §10.3): 64 px (lists), 256 px (cards), 1024 px (hero, profile, match screen).
// A photo is never made larger than it is: the original stands in for any size it cannot reach.
export const PHOTO_SIZES = [64, 256, 1024] as const;
export type StoredFile = "64" | "256" | "1024" | "orig";
export type PhotoSizes = Partial<Record<StoredFile, { w: number; h: number; type?: string }>>; // type: the original's

// Fit inside a max×max box, keeping the shape; never larger than the original.
export function fitWithin(w: number, h: number, max: number) {
  const scale = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

// The smaller copies worth making for an original of w×h.
export function sizesToMake(w: number, h: number): number[] {
  return PHOTO_SIZES.filter((s) => s < Math.max(w, h));
}

// The stored file to show at a wanted size: the smallest one at least that big, else the biggest there is.
export function bestStored(sizes: PhotoSizes, wanted: number): StoredFile {
  const files = (Object.entries(sizes) as [StoredFile, { w: number; h: number }][])
    .map(([file, d]) => ({ file, side: Math.max(d.w, d.h) }))
    .sort((a, b) => a.side - b.side);
  if (files.length === 0) throw new Error("Photo has no stored files");
  return (files.find((f) => f.side >= wanted) ?? files[files.length - 1]).file;
}
