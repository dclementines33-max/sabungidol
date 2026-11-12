// Object URLs for photos, one per photo and size, asked from the Worker once (PRD §13).
// A photo that is replaced or deleted has its URLs revoked with forgetPhoto.
import { create } from "zustand";
import { engine } from "./engineClient";

type State = { urls: Record<string, string> };
export const usePhotoUrls = create<State>()(() => ({ urls: {} }));

const pending = new Set<string>();
const key = (photoId: string, size: number) => `${photoId}:${size}`;

export function photoUrl(photoId: string, size: number): string | undefined {
  return usePhotoUrls.getState().urls[key(photoId, size)];
}

export function requestPhoto(photoId: string, size: number): void {
  const k = key(photoId, size);
  if (pending.has(k) || photoUrl(photoId, size)) return;
  pending.add(k);
  engine().photoBlob(photoId, size).then((blob) => {
    if (blob) usePhotoUrls.setState((s) => ({ urls: { ...s.urls, [k]: URL.createObjectURL(blob) } }));
  }, (error) => console.error("Photo not loaded", photoId, error)).finally(() => pending.delete(k));
}

export function forgetPhoto(photoId: string): void {
  usePhotoUrls.setState((s) => {
    const urls = { ...s.urls };
    for (const k of Object.keys(urls)) {
      if (k.startsWith(`${photoId}:`)) {
        URL.revokeObjectURL(urls[k]);
        delete urls[k];
      }
    }
    return { urls };
  });
}
