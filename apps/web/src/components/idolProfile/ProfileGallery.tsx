// Idol Profile gallery: every gallery photo of the idol (the MatchModal shows 3 of them); a click shows it large.
import { GalleryThumb, PhotoLightbox } from "@sabung/ui";
import { useState } from "react";

export function ProfileGallery({ name, photos }: { name: string; photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return <p className="m-0 text-sm text-text-secondary">Belum ada foto galeri. Tambahkan lewat Studio → Input Data → Galeri foto.</p>;
  return (
    <>
      <ul aria-label={`Galeri ${name}`} className="m-0 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-6">
        {photos.map((photoId, i) => (
          <li key={photoId}><GalleryThumb photoId={photoId} label={`Lihat foto ${i + 1} dari ${photos.length}, ${name}`} onOpen={() => setOpen(i)} /></li>
        ))}
      </ul>
      {open !== null && <PhotoLightbox photos={photos} index={open} name={name} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
