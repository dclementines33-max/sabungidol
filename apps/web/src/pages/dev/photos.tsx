// Fase 2 check (not in the menu): store a photo the way the app will (OPFS + 64/256 WebP copies,
// never enlarged) and read each size back. Uses the separate check database, not your data.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { engine } from "../../data/engineClient";

export const Route = createFileRoute("/dev/photos")({ component: PhotoCheck });

const DATABASE = "sabung-idol-devcheck";
const SIZES = [64, 256, 1024];

function PhotoCheck() {
  const [photoId, setPhotoId] = useState(() => (typeof location === "undefined" ? null : new URLSearchParams(location.search).get("photo")));
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) return;
    let made: string[] = [];
    Promise.all(SIZES.map(async (size) => [size, await engine(DATABASE).photoBlob(photoId, size)] as const)).then((blobs) => {
      made = blobs.flatMap(([, b]) => (b ? [URL.createObjectURL(b)] : []));
      setUrls(Object.fromEntries(blobs.map(([size, b], i) => [size, b ? made[i] : ""])));
    }, (e) => setError(String(e)));
    return () => made.forEach((u) => URL.revokeObjectURL(u));
  }, [photoId]);

  return (
    <div className="max-w-3xl space-y-4">
      <label className="block text-sm text-text-secondary">
        Pilih foto
        <input
          type="file"
          accept="image/*"
          className="mt-1 block text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setPhotoId(await engine(DATABASE).savePhoto(file));
            } catch (err) {
              setError(String(err));
            }
          }}
        />
      </label>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {photoId && <p className="font-mono text-xs text-text-secondary" data-testid="photo-id">{photoId}</p>}
      <div className="flex items-end gap-4">
        {SIZES.map((size) => urls[size] && (
          <figure key={size} className="m-0 text-center">
            <img src={urls[size]} alt={`Ukuran ${size}`} data-size={size} />
            <figcaption className="font-mono text-xs text-text-secondary">{size}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
