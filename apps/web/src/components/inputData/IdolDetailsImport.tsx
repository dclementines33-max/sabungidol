// Input Data → "Perbarui data idol" (Update 3): a JSON list of { name, group, birthday, nationality, role } — e.g. the
// file Claude made from the web — overwrites those fields for the idols it names (by name + group). Preview, then apply.
import type { IdolDetails } from "@sabung/db";
import { Button } from "@sabung/ui";
import { useState } from "react";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SECTION } from "../settings/settingsShared";

type Preview = { rows: IdolDetails[]; updated: number; unknown: string[] };

export function IdolDetailsImport() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const read = async (file: File) => {
    setError(null);
    try {
      const rows = JSON.parse(await file.text()) as IdolDetails[];
      if (!Array.isArray(rows)) throw new Error("File harus berisi daftar (array) idol.");
      setPreview({ rows, ...(await engine().updateIdolDetails(rows, true)) });
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const apply = async () => {
    const { updated } = await engine().updateIdolDetails(preview!.rows, false);
    notify({ level: "success", message: `Data ${updated} idol diperbarui` });
    setPreview(null);
    await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
  };
  return (
    <section aria-labelledby="details-import" className={SECTION}>
      <h2 id="details-import" className="m-0 font-display">Perbarui data idol</h2>
      <p className="m-0 text-sm text-text-secondary">File JSON berisi tanggal lahir, negara dan role. Idol dicocokkan dari nama + grup; isian di file menimpa yang lama. Rating dan foto tidak berubah.</p>
      <label className="block text-sm text-text-secondary">Pilih file .json
        <input type="file" accept=".json,application/json" className="mt-1 block text-xs" onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ""; }} />
      </label>
      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
      {preview && (
        <div className="space-y-2 bg-surface/60 p-3 text-sm">
          <p className="m-0">{preview.updated} idol akan diperbarui{preview.unknown.length ? `, ${preview.unknown.length} tidak ditemukan` : ""}.</p>
          {preview.unknown.length > 0 && <p className="m-0 text-xs text-text-secondary">Tidak ditemukan: {preview.unknown.join(", ")}</p>}
          <div className="flex gap-2">
            <Button variant="primary" disabled={!preview.updated} onClick={() => void apply()}>Terapkan</Button>
            <Button onClick={() => setPreview(null)}>Batal</Button>
          </div>
        </div>
      )}
    </section>
  );
}
