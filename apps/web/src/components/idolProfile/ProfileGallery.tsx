// Idol Profile gallery: every gallery photo of the idol (the MatchModal shows 3 of them); a click shows it large.
// "Add photos" opens the phone's photo library or camera (a folder picker doesn't exist there) and keeps the photos already in.
import { Button, GalleryThumb, PhotoLightbox } from "@sabung/ui";
import { useRef, useState } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";

export function ProfileGallery({ idolId, name, photos }: { idolId: string; name: string; photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const add = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      await engine().addGalleryPhotos(idolId, files);
      notify({ level: "success", message: `${files.length} photo${files.length > 1 ? "s" : ""} added to ${name}` });
      await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    } catch (error) {
      notify({ level: "error", code: "E-PHOTO-003", message: `Photos couldn't be added to ${name}. The gallery is unchanged.`, context: String(error) });
    }
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <Button disabled={busy} onClick={() => picker.current?.click()}>{busy ? "Adding…" : "Add photos"}</Button>
      <input ref={picker} type="file" accept="image/*" multiple hidden aria-label={`Add photos to ${name}`} onChange={(e) => { void add([...(e.target.files ?? [])]); e.target.value = ""; }} />
      {!photos.length ? <p className="m-0 text-sm text-text-secondary">No gallery photos yet.</p> : (
        <ul aria-label={`${name} gallery`} className="m-0 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photoId, i) => (
            <li key={photoId}><GalleryThumb photoId={photoId} label={`View photo ${i + 1} of ${photos.length}, ${name}`} onOpen={() => setOpen(i)} /></li>
          ))}
        </ul>
      )}
      {open !== null && <PhotoLightbox photos={photos} index={open} name={name} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
