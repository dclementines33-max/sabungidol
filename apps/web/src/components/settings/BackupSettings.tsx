// Settings → Backup (PRD §12.3): download a section as a .sabung file, import one in two steps
// (preview, then Merge or Replace), and the 3 automatic snapshots taken before dangerous actions.
import { type BackupSection, SECTION_LABELS } from "@sabung/shared";
import { Button, ImportDialog, type ImportPreview } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SECTION } from "./settingsShared";

const download = (bytes: Uint8Array, name: string) => {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function BackupSettings({ seasonId }: { seasonId: string }) {
  const [section, setSection] = useState<BackupSection>("full");
  const [importing, setImporting] = useState(false);
  const file = useRef<Uint8Array | null>(null);
  const { data: snapshots = [], refetch } = useQuery({ queryKey: ["snapshots"], queryFn: () => engine().listSnapshots() });

  const exportNow = async () => {
    const { bytes, name } = await engine().exportBackup(section, section === "season" ? seasonId : undefined);
    download(bytes, name);
    notify({ level: "success", message: `Backup ${SECTION_LABELS[section]} diunduh` }, { log: false }); // the Worker logged it
  };
  // The dialog shows one preview: what Merge adds, and how many rows Replace would overwrite.
  const readFile = async (picked: File): Promise<ImportPreview> => {
    file.current = new Uint8Array(await picked.arrayBuffer());
    const [merge, replace] = await Promise.all([engine().previewImport(file.current, "merge"), engine().previewImport(file.current, "replace")]);
    return { added: merge.added, replaced: replace.replaced, conflicts: merge.conflicts, unknown: merge.unknown };
  };
  const apply = async (mode: "merge" | "replace") => {
    try {
      const result = await engine().applyImport(file.current!, mode);
      notify({ level: "success", message: `Backup diimpor (${mode === "merge" ? "Merge" : "Replace"}): ${result.added} baris ditambah${result.replaced ? `, ${result.replaced} diganti` : ""}` });
      await queryClient.invalidateQueries();
      await refetch();
    } catch (error) {
      notify({ level: "error", code: "E-BACKUP-002", message: "Impor gagal; tidak ada yang berubah.", context: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <section className={SECTION} aria-labelledby="set-backup">
      <h2 id="set-backup" className="m-0 font-display text-lg">Backup</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-text-secondary">
          Bagian
          <select value={section} onChange={(e) => setSection(e.target.value as BackupSection)} className="mt-1 block rounded-control border border-border-strong bg-surface px-2 py-2 text-text-primary">
            {Object.entries(SECTION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <Button variant="primary" onClick={exportNow}>Unduh backup</Button>
        <Button onClick={() => setImporting(true)}>Impor backup…</Button>
      </div>
      <ImportDialog open={importing} onOpenChange={setImporting} title="Impor backup .sabung" accept=".sabung" readFile={readFile} onApply={apply} />
      <div>
        <h3 className="m-0 text-sm font-medium">Snapshot otomatis (3 terakhir, dibuat sebelum aksi berbahaya)</h3>
        {snapshots.length === 0
          ? <p className="m-0 mt-1 text-sm text-text-secondary">Belum ada snapshot.</p>
          : (
            <ul className="m-0 mt-2 list-none space-y-1 p-0 text-sm">
              {snapshots.map((s) => (
                <li key={s.name} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate font-mono text-text-secondary">{s.name}</span>
                  <Button className="px-2 py-1" onClick={async () => download(await engine().readSnapshot(s.name), s.name)}>Unduh</Button>
                </li>
              ))}
            </ul>
          )}
      </div>
    </section>
  );
}
