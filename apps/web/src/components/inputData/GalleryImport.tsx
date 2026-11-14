// Input Data, gallery photos: pick the gallery folder once; every subfolder "Name GROUP" is matched to an
// idol (same matching as Photo Import) and checked by the user before saving. Saving replaces that idol's gallery.
import type { IdolRow } from "@sabung/db";
import { Button, SearchableIdolSelect } from "@sabung/ui";
import { FolderOpen, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { forgetPhoto } from "../../data/photoCache";
import { queryClient } from "../../data/queryClient";
import { matchName } from "./matchPhotos";

type Folder = { name: string; files: File[]; idolId: string | null; sure: boolean };

// Files of a picked folder, grouped by the folder they sit in ("gallery/Liz IVE/01.jpg" → "Liz IVE").
export function groupByFolder(files: File[], idols: IdolRow[]): Folder[] {
  const byFolder = new Map<string, File[]>();
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const parts = file.webkitRelativePath.split("/");
    const name = parts.length > 1 ? parts[parts.length - 2]! : "";
    byFolder.set(name, [...(byFolder.get(name) ?? []), file]);
  }
  return [...byFolder].map(([name, list]) => ({ name, files: list.sort((a, b) => a.name.localeCompare(b.name)), ...matchName(name, idols) }));
}

export function GalleryImport({ idols }: { idols: IdolRow[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [saved, setSaved] = useState<number | null>(null);
  const ids = useMemo(() => idols.map((i) => i.id), [idols]);
  const previews = useMemo(() => folders.map((f) => URL.createObjectURL(f.files[0]!)), [folders]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  const ready = folders.filter((f) => f.idolId);

  const set = (i: number, idolId: string | null) => setFolders((all) => all.map((f, n) => (n === i ? { ...f, idolId, sure: true } : f)));
  const save = async () => {
    setSaved(0);
    let done = 0;
    for (const f of ready) {
      try {
        (await engine().setGallery(f.idolId!, f.files)).forEach(forgetPhoto);
        setSaved(++done);
      } catch (error) {
        notify({ level: "error", code: "E-PHOTO-003", message: `Galeri ${f.name} gagal disimpan. Galeri lain tetap tersimpan.`, context: String(error) });
      }
    }
    notify({ level: "success", message: `Galeri ${done} idol disimpan` });
    setFolders([]);
    setSaved(null);
    await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
  };

  return (
    <section className="studio-section space-y-4" aria-labelledby="gallery">
      <h2 id="gallery" className="m-0 font-display">Galeri foto</h2>
      <p className="m-0 text-sm text-text-secondary">Foto tambahan yang tampil di samping match. Pilih folder galeri: tiap subfolder bernama "Nama GROUP" dicocokkan ke idolnya. Galeri lama idol itu diganti.</p>
      <Button onClick={() => input.current?.click()}><FolderOpen aria-hidden="true" size={16} strokeWidth={1.5} /> Pilih folder galeri…</Button>
      <input ref={input} type="file" multiple hidden {...{ webkitdirectory: "" }} onChange={(e) => {
        setFolders(groupByFolder([...(e.target.files ?? [])], idols));
        e.target.value = ""; // the same folder can be picked again
      }} />
      {folders.length > 0 && (
        <>
          <p className="m-0 text-sm text-text-secondary" aria-live="polite">
            {folders.length} folder · {folders.reduce((n, f) => n + f.files.length, 0)} foto · {folders.filter((f) => f.sure && f.idolId).length} cocok · {folders.filter((f) => !f.sure && f.idolId).length} saran, periksa · {folders.filter((f) => !f.idolId).length} belum dipilih
          </p>
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {folders.map((f, i) => (
              <li key={f.name} className="flex items-start gap-3 panel bg-surface p-3">
                <img src={previews[i]} alt="" className="aspect-[4/5] w-16 rounded-control object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate font-mono text-xs text-text-secondary">{f.name} · {f.files.length} foto</p>
                  <p className={`m-0 text-xs ${f.idolId ? (f.sure ? "text-cool" : "text-accent-bright") : "text-text-secondary"}`}>
                    {f.idolId ? (f.sure ? "Cocok" : "Saran: periksa") : "Belum dipilih"}
                  </p>
                  <SearchableIdolSelect label={`Idol untuk folder ${f.name}`} idolIds={ids} value={f.idolId} onChange={(id) => set(i, id)} />
                </div>
                <Button className="px-2" aria-label={`Buang folder ${f.name}`} onClick={() => setFolders((all) => all.filter((_, n) => n !== i))}>
                  <X aria-hidden="true" size={16} strokeWidth={1.5} />
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="primary" disabled={saved !== null || ready.length === 0} onClick={save}>
            {saved !== null ? `Menyimpan ${saved}/${ready.length}…` : `Simpan galeri ${ready.length} idol`}
          </Button>
        </>
      )}
    </section>
  );
}
