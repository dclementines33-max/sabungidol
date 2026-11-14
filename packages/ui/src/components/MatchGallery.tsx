// Beside the MatchModal: 3 gallery photos of one idol, picked at random every time the match opens
// (the modal mounts it on open; user decision). A click shows the photo large.
import { useState } from "react";
import { PhotoLightbox } from "./PhotoLightbox";
import { useGalleryPhoto, useIdol } from "./idolSource";

const SHOWN = 3;

function pick<T>(list: T[], n: number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out.slice(0, n);
}

export function GalleryThumb({ photoId, label, onOpen }: { photoId: string; label: string; onOpen: () => void }) {
  const src = useGalleryPhoto(photoId, 256);
  return (
    <button type="button" aria-label={label} onClick={onOpen} className="block w-full cursor-zoom-in rounded-control focus-visible:outline-2 focus-visible:outline-accent-bright">
      {src
        ? <img src={src} alt="" loading="lazy" decoding="async" className="aspect-[4/5] w-full rounded-control object-cover transition-opacity hover:opacity-80" />
        : <span className="block aspect-[4/5] w-full rounded-control bg-surface" />}
    </button>
  );
}

export function MatchGallery({ idolId, side }: { idolId: string; side: "A" | "B" }) {
  const idol = useIdol(idolId);
  const [shown] = useState(() => pick(idol.gallery ?? [], SHOWN));
  const [open, setOpen] = useState<number | null>(null);
  if (!shown.length) return null;
  return (
    <section aria-label={`Galeri ${idol.name}`} className="min-w-0 lg:sticky lg:top-0">
      <p className={`m-0 mb-2 truncate text-xs font-bold tracking-[0.2em] uppercase ${side === "A" ? "text-accent-bright" : "text-cool"}`}>
        Galeri · {idol.name}
      </p>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 lg:grid-cols-1">
        {shown.map((photoId, i) => (
          <li key={photoId}><GalleryThumb photoId={photoId} label={`Lihat foto ${i + 1} dari ${shown.length}, ${idol.name}`} onOpen={() => setOpen(i)} /></li>
        ))}
      </ul>
      {open !== null && <PhotoLightbox photos={shown} index={open} name={idol.name} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}
