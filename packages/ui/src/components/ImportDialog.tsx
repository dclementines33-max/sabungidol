// Import in two steps (PRD §9, §12.3): pick a file → preview what changes → "Confirm & Apply".
// Nothing is written before Apply. Replace overwrites, so it is the red, dangerous button.
import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type ImportPreview = {
  added: number;
  replaced: number;
  conflicts: string[]; // e.g. "Mina (Aurora): rating 92 → 88"
  unknown: string[]; // names that match no idol
};
export type ImportMode = "merge" | "replace";

type State = { step: "pick" } | { step: "reading" } | { step: "preview"; preview: ImportPreview } | { step: "failed"; message: string };

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer">{title} ({items.length})</summary>
      <ul className="m-0 mt-1 max-h-40 overflow-auto pl-5 text-text-secondary">{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </details>
  );
}

export function ImportDialog({ open, onOpenChange, title, accept, readFile, onApply, file }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  accept: string; // e.g. ".sabung,.csv,.json"
  readFile: (file: File) => Promise<ImportPreview>; // throws with a clear message, e.g. a backup from a newer version
  onApply: (mode: ImportMode) => void;
  file?: File; // already chosen (e.g. downloaded from the cloud): no picker, the preview starts at once
}) {
  const [state, setState] = useState<State>({ step: "pick" });
  const [mode, setMode] = useState<ImportMode>("merge");
  const close = (next: boolean) => {
    if (!next) setState({ step: "pick" });
    onOpenChange(next);
  };
  const read = async (picked: File) => {
    setState({ step: "reading" });
    try {
      setState({ step: "preview", preview: await readFile(picked) });
    } catch (error) {
      setState({ step: "failed", message: error instanceof Error ? error.message : String(error) });
    }
  };
  useEffect(() => {
    if (open && file) void read(file);
  }, [open, file]); // only when a new file arrives, not on every render's new `read`

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={title}
      footer={
        <>
          <Button onClick={() => close(false)}>Batal</Button>
          <Button
            variant={mode === "replace" ? "danger" : "primary"}
            disabled={state.step !== "preview"}
            onClick={() => {
              onApply(mode);
              close(false);
            }}
          >
            Confirm &amp; Apply
          </Button>
        </>
      }
    >
      {file ? <p className="m-0 font-mono text-sm text-text-secondary">{file.name}</p> : <label className="block text-sm">
        File
        <input
          type="file"
          accept={accept}
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-control file:border file:border-border-strong file:bg-surface file:px-3 file:py-1 file:text-text-primary"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) void read(picked);
          }}
        />
      </label>}

      {state.step === "reading" && <p role="status" className="mt-4 text-sm text-text-secondary">Membaca file…</p>}
      {state.step === "failed" && <p role="alert" className="mt-4 text-sm text-danger">{state.message}</p>}
      {state.step === "preview" && (
        <div className="mt-4">
          <p className="m-0 text-sm">
            <span className="font-mono tabular-nums">{state.preview.added}</span> ditambah ·{" "}
            <span className="font-mono tabular-nums">{state.preview.replaced}</span> diganti
          </p>
          <List title="Konflik" items={state.preview.conflicts} />
          <List title="Tidak dikenal" items={state.preview.unknown} />
          <fieldset className="mt-4 border-0 p-0">
            <legend className="text-sm text-text-secondary">Mode</legend>
            {(["merge", "replace"] as const).map((m) => (
              <label key={m} className="mr-4 inline-flex items-center gap-2 text-sm">
                <input type="radio" name="import-mode" checked={mode === m} onChange={() => setMode(m)} className="accent-accent-bright" />
                {m === "merge" ? "Merge" : "Replace (data lama ditimpa)"}
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </Modal>
  );
}
