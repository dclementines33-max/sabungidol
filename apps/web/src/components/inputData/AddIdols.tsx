// Input Data, adding idols (PRD §8): paste, a CSV/JSON file or the form all fill one preview;
// only new and warning rows are saved, in one transaction.
import type { IdolRow } from "@sabung/db";
import { type Fields, csvToFields, jsonToFields, pasteToFields, previewBatch } from "@sabung/shared";
import { Button } from "@sabung/ui";
import { useMemo, useState } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { IdolForm } from "./IdolForm";
import { PasteBatchPreview } from "./PasteBatchPreview";

const SOURCES = { paste: "Paste", file: "File CSV/JSON", form: "Satu idol" } as const;

export function AddIdols({ idols }: { idols: IdolRow[] }) {
  const [source, setSource] = useState<keyof typeof SOURCES>("paste");
  const [text, setText] = useState("");
  const [fields, setFields] = useState<Fields[]>([]);
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => previewBatch(fields, idols.map((i) => ({ name: i.name, groupName: i.groupName }))), [fields, idols]);
  const toSave = rows.flatMap((r) => (r.input ? [r.input] : []));
  // Update 3: idols that already exist (refused as duplicates) can still take this file's birthday and nationality.
  const existing = rows.filter((r) => r.status === "duplicate").map((r) => fields[r.line - 1]!)
    .filter((f) => f.birthday?.trim() || f.nationality?.trim())
    .map((f) => ({ name: f.name!.trim(), group: f.group?.trim() || null, ...(f.birthday?.trim() ? { birthday: f.birthday.trim() } : {}), ...(f.nationality?.trim() ? { nationality: f.nationality.trim().toUpperCase() } : {}) }));
  const updateExisting = async () => {
    setSaving(true);
    try {
      const { updated } = await engine().updateIdolDetails(existing, false);
      notify({ level: "success", message: `Tanggal lahir & negara ${updated} idol diperbarui` });
      setFields([]);
      await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    } catch (error) {
      notify({ level: "error", code: "E-INPUT-003", message: "Data idol gagal diperbarui. Tidak ada yang berubah.", context: String(error) });
    } finally {
      setSaving(false);
    }
  };
  const groups = useMemo(() => [...new Set(idols.flatMap((i) => (i.groupName ? [i.groupName] : [])))].sort(), [idols]);

  const readFile = async (file: File) => {
    try {
      const content = await file.text();
      setFields(file.name.toLowerCase().endsWith(".json") ? jsonToFields(content) : csvToFields(content));
    } catch (error) {
      notify({ level: "error", code: "E-INPUT-001", message: `File ${file.name} tidak bisa dibaca. Pakai CSV dengan header (name,group,rating,…) atau JSON berupa daftar.`, context: String(error) });
    }
  };
  const save = async () => {
    setSaving(true);
    try {
      const { added } = await engine().addIdols(toSave);
      notify({ level: "success", message: `${added.length} idol disimpan` });
      setText("");
      setFields([]);
      await queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });
    } catch (error) {
      notify({ level: "error", code: "E-INPUT-002", message: "Idol gagal disimpan. Tidak ada yang berubah; coba lagi.", context: String(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="studio-section space-y-4" aria-labelledby="add-idols">
      <h2 id="add-idols" className="m-0 font-display">Tambah idol</h2>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Cara menambah">
        {Object.entries(SOURCES).map(([key, label]) => (
          <Button key={key} aria-pressed={source === key} className={`px-3 ${source === key ? "bg-surface-hover" : ""}`}
            onClick={() => { setSource(key as keyof typeof SOURCES); setFields([]); }}>{label}</Button>
        ))}
      </div>
      {source === "paste" && (
        <label className="block text-sm text-text-secondary">
          Satu idol per baris: <span className="font-mono">Nama | Group | Rating | Seed | Nationality | YYYY-MM-DD</span>
          <textarea value={text} rows={6} onChange={(e) => { setText(e.target.value); setFields(pasteToFields(e.target.value)); }}
            className="mt-1 block w-full rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-3 py-2 font-mono text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright" />
        </label>
      )}
      {source === "file" && (
        <label className="block text-sm text-text-secondary">
          File CSV (header: name,group,rating,seed,nationality,birthday) atau JSON
          <input type="file" accept=".csv,.json,text/csv,application/json" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
            className="mt-1 block text-text-primary" />
        </label>
      )}
      {source === "form" && <IdolForm groups={groups} onFields={setFields} />}
      {rows.length > 0 && (
        <>
          {existing.length > 0 && (
            <p className="m-0 bg-surface/60 p-3 text-sm">
              {existing.length} idol sudah ada, jadi tidak ditambah. Tanggal lahir dan negaranya dari file ini bisa dipakai untuk memperbarui mereka.{" "}
              <Button variant="primary" className="mt-2" disabled={saving} onClick={() => void updateExisting()}>Perbarui lahir & negara {existing.length} idol</Button>
            </p>
          )}
          <PasteBatchPreview rows={rows} />
          <Button variant="primary" disabled={saving || toSave.length === 0} onClick={save}>
            {saving ? "Menyimpan…" : `Simpan ${toSave.length} idol`}
          </Button>
        </>
      )}
    </section>
  );
}
