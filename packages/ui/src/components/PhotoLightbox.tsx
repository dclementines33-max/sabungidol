// One gallery photo shown large, with ‹ › on the left and right middle of a fixed-size frame, so the buttons
// stay put whatever the photo's shape. Arrow keys step too; both ends wrap around.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "./Modal";
import { useGalleryPhoto } from "./idolSource";

const ARROW = "absolute top-1/2 -translate-y-1/2 rounded-full bg-bg-base/70 p-2 text-text-primary hover:bg-bg-base focus-visible:outline-2 focus-visible:outline-accent-bright";

export function PhotoLightbox({ photos, index, name, onIndex, onClose }: {
  photos: string[];
  index: number;
  name: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const src = useGalleryPhoto(photos[index]!, 1024);
  const step = (by: number) => onIndex((index + by + photos.length) % photos.length);
  const alt = `${name}, foto ${index + 1}`;
  return (
    <Modal open onOpenChange={(open) => { if (!open) onClose(); }} title={`${name} · ${index + 1}/${photos.length}`} className="max-w-3xl">
      <div className="relative flex h-[70vh] items-center justify-center" onKeyDown={(e) => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); }}>
        {src
          ? <img src={src} alt={alt} className="max-h-full max-w-full rounded-control object-contain" />
          : <div role="img" aria-label={alt} className="aspect-[4/5] h-full rounded-control bg-surface" />}
        {photos.length > 1 && (
          <>
            <button type="button" aria-label="Foto sebelumnya" className={`${ARROW} left-0`} onClick={() => step(-1)}><ChevronLeft aria-hidden="true" size={24} /></button>
            <button type="button" aria-label="Foto berikutnya" className={`${ARROW} right-0`} onClick={() => step(1)}><ChevronRight aria-hidden="true" size={24} /></button>
          </>
        )}
      </div>
    </Modal>
  );
}
