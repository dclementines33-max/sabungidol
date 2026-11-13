// Input Data, photos (PRD §8): drop many files, each is matched to an idol by its name; the user
// checks every match (and picks where unsure) before anything is saved. A new photo replaces the old.
import type { IdolRow } from "@sabung/db";
import { Button, PhotoDropZone, SearchableIdolSelect } from "@sabung/ui";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { forgetPhoto } from "../../data/photoCache";
import { queryClient } from "../../data/queryClient";
import { type PhotoMatch, matchPhotos } from "./matchPhotos";

export function PhotoImport({ idols }: { idols: IdolRow[] }) {
  const [matches, setMatches] = useState<PhotoMatch[]>([]);
  const [saved, setSaved] = useState<number | null>(null); // progress while saving
  const ids = useMemo(() => idols.map((i) => i.id), [idols]);
  const previews = useMemo(() => matches.map((m) => URL.createObjectURL(m.file)), [matches]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  const ready = matches.filter((m) => m.idolId);

  const set = (i: number, idolId: string | null) => setMatches((all) => all.map((m, n) => (n === i ? { ...m, idolId, sure: true } : m)));
  const save = async () => {
    setSaved(0);
    let done = 0;
    for (const m of ready) {
      try {
        const { old } = await engine().replacePhoto(m.idolId!, m.file);
        if (old) forgetPhoto(old);
        setSaved(++done);
      } catch (error) {
        notify({ level: "error", code: "E-PHOTO-002", message: `Foto ${m.file.name} gagal disimpan. Foto lain tetap tersimpan.`, context: String(error) });
      }
    }
    notify({ level: "success", message: `${done} foto disimpan` });
    setMatches([]);
    setSaved(null);
    await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
  };

  return (
    <section className="studio-section space-y-4" aria-labelledby="photos">
      <h2 id="photos" className="m-0 font-display">Foto</h2>
      <PhotoDropZone label="Seret banyak foto sekaligus; nama file dicocokkan ke nama idol" onFiles={(files) => setMatches(matchPhotos(files, idols))} />
      {matches.length > 0 && (
        <>
          <p className="m-0 text-sm text-text-secondary" aria-live="polite">
            {matches.filter((m) => m.sure && m.idolId).length} cocok · {matches.filter((m) => !m.sure && m.idolId).length} saran, periksa · {matches.filter((m) => !m.idolId).length} belum dipilih
          </p>
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
            {matches.map((m, i) => (
              <li key={`${m.file.name}-${i}`} className="flex items-start gap-3 panel bg-surface p-3">
                <img src={previews[i]} alt="" className="aspect-[4/5] w-16 rounded-control object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate font-mono text-xs text-text-secondary">{m.file.name}</p>
                  <p className={`m-0 text-xs ${m.idolId ? (m.sure ? "text-cool" : "text-accent-bright") : "text-text-secondary"}`}>
                    {m.idolId ? (m.sure ? "Cocok" : "Saran: periksa") : "Belum dipilih"}
                  </p>
                  <SearchableIdolSelect label={`Idol untuk ${m.file.name}`} idolIds={ids} value={m.idolId} onChange={(id) => set(i, id)} />
                </div>
                <Button className="px-2" aria-label={`Buang ${m.file.name}`} onClick={() => setMatches((all) => all.filter((_, n) => n !== i))}>
                  <X aria-hidden="true" size={16} strokeWidth={1.5} />
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="primary" disabled={saved !== null || ready.length === 0} onClick={save}>
            {saved !== null ? `Menyimpan ${saved}/${ready.length}…` : `Simpan ${ready.length} foto`}
          </Button>
        </>
      )}
    </section>
  );
}
