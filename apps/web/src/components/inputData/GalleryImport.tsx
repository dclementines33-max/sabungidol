// Input Data, gallery photos: pick the gallery folder once; every subfolder "Name GROUP" is matched to an
// idol (same matching as Photo Import) and checked by the user before saving. Saving replaces that idol's gallery.
import type { IdolRow } from "@sabung/db";
import { Button, SearchableIdolSelect } from "@sabung/ui";
import { FolderOpen, X } from "@sabung/ui/icons";
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
        notify({ level: "error", code: "E-PHOTO-003", message: `Gallery ${f.name} couldn't be saved. The other galleries are safe.`, context: String(error) });
      }
    }
    notify({ level: "success", message: `Galleries saved for ${done} idols` });
    setFolders([]);
    setSaved(null);
    await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
  };

  return (
    <section className="studio-section space-y-4" aria-labelledby="gallery">
      <h2 id="gallery" className="m-0 font-display">Photo gallery</h2>
      <p className="m-0 text-sm text-text-secondary">Extra photos shown beside a match. Pick a gallery folder: each subfolder named "Name GROUP" is matched to its idol. That idol's old gallery is replaced.</p>
      <Button onClick={() => input.current?.click()}><FolderOpen aria-hidden="true" size={16} strokeWidth={1.5} /> Choose gallery folder…</Button>
      <input ref={input} type="file" multiple hidden {...{ webkitdirectory: "" }} onChange={(e) => {
        setFolders(groupByFolder([...(e.target.files ?? [])], idols));
        e.target.value = ""; // the same folder can be picked again
      }} />
      {folders.length > 0 && (
        <>
          <p className="m-0 text-sm text-text-secondary" aria-live="polite">
            {folders.length} folders · {folders.reduce((n, f) => n + f.files.length, 0)} photos · {folders.filter((f) => f.sure && f.idolId).length} matched · {folders.filter((f) => !f.sure && f.idolId).length} suggested, check · {folders.filter((f) => !f.idolId).length} not picked
          </p>
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {folders.map((f, i) => (
              <li key={f.name} className="flex items-start gap-3 panel bg-surface p-3">
                <img src={previews[i]} alt="" className="aspect-[4/5] w-16 rounded-control object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate font-mono text-xs text-text-secondary">{f.name} · {f.files.length} photos</p>
                  <p className={`m-0 text-xs ${f.idolId ? (f.sure ? "text-cool" : "text-accent-bright") : "text-text-secondary"}`}>
                    {f.idolId ? (f.sure ? "Match" : "Suggested: check") : "Not picked"}
                  </p>
                  <SearchableIdolSelect label={`Idol for folder ${f.name}`} idolIds={ids} value={f.idolId} onChange={(id) => set(i, id)} />
                </div>
                <Button className="px-2" aria-label={`Remove folder ${f.name}`} onClick={() => setFolders((all) => all.filter((_, n) => n !== i))}>
                  <X aria-hidden="true" size={16} strokeWidth={1.5} />
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="primary" disabled={saved !== null || ready.length === 0} onClick={save}>
            {saved !== null ? `Saving ${saved}/${ready.length}…` : `Save galleries for ${ready.length} idols`}
          </Button>
        </>
      )}
    </section>
  );
}
