// Marble Race panel · LED screens: the screens round every arena show the competition being played, both idols' photos
// and the competition logo by themselves; here the user adds their own pictures (one is shown when a match has no logo,
// and in test races). Pictures are shrunk to a small JPEG before they are kept.
import { Button } from "@sabung/ui";
import { Trash } from "@sabung/ui/icons";
import { useState } from "react";
import { MAX_LED, useArenaSettings } from "../../data/arenaSettings";

// A picture as a 640 × 320 JPEG data URL (the screens are 2:1), cropped from the middle, top kept for faces.
async function shrink(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const c = document.createElement("canvas"); c.width = 640; c.height = 320;
  const s = Math.max(640 / img.width, 320 / img.height);
  c.getContext("2d")!.drawImage(img, (640 - img.width * s) / 2, 0, img.width * s, img.height * s);
  img.close();
  return c.toDataURL("image/jpeg", 0.8);
}

export function LedPhotos() {
  const { led, addLed, removeLed } = useArenaSettings();
  const [error, setError] = useState<string | null>(null);
  const add = async (files: FileList | null) => {
    setError(null);
    for (const file of [...(files ?? [])].slice(0, MAX_LED - led.length)) {
      try { addLed(await shrink(file)); } catch { setError(`“${file.name}” isn't a picture the browser can read.`); }
    }
  };
  return (
    <>
      <p className="m-0 text-sm text-text-secondary">Automatic on every match: “SABUNG IDOL”, the competition (Unzure Cup, Division 1…), both idols' photos and the competition logo. Your own pictures: up to {MAX_LED}, kept in this browser.</p>
      <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
        {led.map((url, i) => (
          <li key={i} className="relative">
            <img src={url} alt={`LED picture ${i + 1}`} className="aspect-[2/1] w-full rounded-control object-cover" />
            <Button className="absolute top-1 right-1 p-1.5" aria-label={`Remove LED picture ${i + 1}`} onClick={() => removeLed(i)}><Trash size={14} aria-hidden="true" /></Button>
          </li>
        ))}
      </ul>
      {led.length < MAX_LED && (
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
          <span className="chip bg-stage-hi py-1.5"><span>Add pictures</span></span>
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
        </label>
      )}
      {error && <p role="alert" className="m-0 mt-2 text-sm text-danger">{error}</p>}
    </>
  );
}
