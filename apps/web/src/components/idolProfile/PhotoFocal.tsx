// Set a photo's focal point (PRD §10.3): the whole uncropped photo; a click marks where the 4:5 crop should centre,
// with a preview of the crop beside it. Saved on the photo record.
import type { IdolRow } from "@sabung/db";
import { Button, IdolPhoto, Modal } from "@sabung/ui";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { photoUrl, requestPhoto, usePhotoUrls } from "../../data/photoCache";
import { queryClient } from "../../data/queryClient";

export function PhotoFocal({ idol }: { idol: IdolRow & { photoId: string } }) {
  const [open, setOpen] = useState(false);
  usePhotoUrls((s) => s.urls);
  const url = photoUrl(idol.photoId, 1024);
  if (open && !url) queueMicrotask(() => requestPhoto(idol.photoId, 1024));
  const point = [idol.focalX ?? 0.5, idol.focalY ?? 0.5];
  const set = async (x: number, y: number) => {
    await engine().setPhotoFocal(idol.photoId, x, y);
    await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    notify({ level: "success", message: "Titik fokus foto disimpan" });
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>Atur fokus foto</Button>
      <Modal open={open} onOpenChange={setOpen} title={`Fokus foto ${idol.name}`} description="Klik bagian foto yang harus selalu terlihat (biasanya wajah)." className="max-w-3xl">
        <div className="flex flex-wrap items-start gap-6">
          {url && (
            <button type="button" aria-label="Pilih titik fokus" className="relative block cursor-crosshair focus-visible:outline-2 focus-visible:outline-accent-bright"
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); void set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }}>
              <img src={url} alt="" className="block max-h-[60vh] max-w-full" />
              <span aria-hidden="true" className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent-bright shadow-[0_0_0_2px_black]" style={{ left: `${point[0] * 100}%`, top: `${point[1] * 100}%` }} />
            </button>
          )}
          <figure className="m-0">
            <IdolPhoto idolId={idol.id} size={256} className="w-32" />
            <figcaption className="kicker mt-1 text-text-secondary">Hasil potongan</figcaption>
          </figure>
        </div>
      </Modal>
    </>
  );
}
