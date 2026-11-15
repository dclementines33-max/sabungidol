// One gallery photo shown large, with ‹ › on the left and right middle of a fixed-size frame, so the buttons
// stay put whatever the photo's shape. Arrow keys step too; both ends wrap around.
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { useGalleryPhoto, useIdolPhoto } from "./idolSource";

const ARROW = "absolute top-1/2 -translate-y-1/2 rounded-full bg-bg-base/70 p-2 text-text-primary hover:bg-bg-base focus-visible:outline-2 focus-visible:outline-accent-bright";

// main: an idol id whose main photo comes first (index 0), then the gallery. children: shown under the photo (Rating Manager).
export function PhotoLightbox({ photos, main, index, name, onIndex, onClose, children }: {
  photos: string[];
  main?: string;
  children?: ReactNode;
  index: number;
  name: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const first = main ? 1 : 0; // slots taken by the main photo
  const total = photos.length + first;
  const galleryId = photos[index - first];
  const gallerySrc = useGalleryPhoto(galleryId ?? "", 1024);
  const mainSrc = useIdolPhoto(main ?? "", 1024);
  const src = galleryId ? gallerySrc : mainSrc;
  const step = (by: number) => onIndex((index + by + total) % total);
  const alt = `${name}, photo ${index + 1}`;
  return (
    <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={`${name} · ${index + 1}/${total}`} className="max-w-3xl">
      <div className="relative flex h-[70vh] items-center justify-center" onKeyDown={(e) => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); }}>
        {src
          ? <img src={src} alt={alt} className="max-h-full max-w-full rounded-control object-contain" />
          : <div role="img" aria-label={alt} className="aspect-[4/5] h-full rounded-control bg-surface" />}
        {total > 1 && (
          <>
            <button type="button" aria-label="Previous photo" className={`${ARROW} left-0`} onClick={() => step(-1)}><ChevronLeft aria-hidden="true" size={24} /></button>
            <button type="button" aria-label="Next photo" className={`${ARROW} right-0`} onClick={() => step(1)}><ChevronRight aria-hidden="true" size={24} /></button>
          </>
        )}
      </div>
      {children}
    </Modal>
  );
}
