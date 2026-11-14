// Input Data → "Update idol details" (Update 3): a JSON list of { name, group, birthday, nationality, role } — e.g. the
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
      if (!Array.isArray(rows)) throw new Error("The file must hold a list (array) of idols.");
      setPreview({ rows, ...(await engine().updateIdolDetails(rows, true)) });
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const apply = async () => {
    const { updated } = await engine().updateIdolDetails(preview!.rows, false);
    notify({ level: "success", message: `Details updated for ${updated} idols` });
    setPreview(null);
    await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
  };
  return (
    <section aria-labelledby="details-import" className={SECTION}>
      <h2 id="details-import" className="m-0 font-display">Update idol details</h2>
      <p className="m-0 text-sm text-text-secondary">A JSON file with birthday, nationality and role. Idols are matched by name + group; values in the file overwrite the old ones. Ratings and photos don't change.</p>
      <label className="block text-sm text-text-secondary">Choose .json file
        <input type="file" accept=".json,application/json" className="mt-1 block text-xs" onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ""; }} />
      </label>
      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
      {preview && (
        <div className="space-y-2 bg-surface/60 p-3 text-sm">
          <p className="m-0">{preview.updated} idols will be updated{preview.unknown.length ? `, ${preview.unknown.length} not found` : ""}.</p>
          {preview.unknown.length > 0 && <p className="m-0 text-xs text-text-secondary">Not found: {preview.unknown.join(", ")}</p>}
          <div className="flex gap-2">
            <Button variant="primary" disabled={!preview.updated} onClick={() => void apply()}>Apply</Button>
            <Button onClick={() => setPreview(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  );
}
