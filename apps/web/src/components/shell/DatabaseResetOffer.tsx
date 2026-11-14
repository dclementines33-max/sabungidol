// Shown under the E-DB-001 error when the database has no "opened" mark (data/resetOffer.ts) — it never
// finished, or the browser emptied it (seen in the in-app browser, whose storage is not permanent):
// the way out of a fresh install that was interrupted, only after the user types HAPUS.
import { Button, ConfirmDialog } from "@sabung/ui";
import { useState } from "react";
import { confirmReset, useResetOffer } from "../../data/resetOffer";

export function DatabaseResetOffer() {
  const database = useResetOffer((s) => s.database);
  const [open, setOpen] = useState(false);
  if (!database) return null;
  return (
    <div className="mb-4 rounded-card bg-surface-hover/60 bg-surface p-4">
      <p className="m-0 text-sm">The database in this browser won't open, and there's no sign any data was ever saved here (it was never finished, or the browser cleared it). If reloading doesn't help, start again with an empty database; got a .sabung backup? Import it afterwards.</p>
      <Button variant="danger" className="mt-3" onClick={() => setOpen(true)}>Restart database…</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Restart the database?"
        message="The Sabung Idol database in this browser is deleted and rebuilt, then the default idols load again. This can't be undone."
        confirmLabel="Delete and restart"
        danger
        typeToConfirm="DELETE"
        onConfirm={() => confirmReset(database)}
      />
    </div>
  );
}
