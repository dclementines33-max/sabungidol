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
    <div className="mb-4 rounded-card border border-border-strong bg-surface p-4">
      <p className="m-0 text-sm">Database di browser ini tidak bisa dibuka, dan tidak ada tanda bahwa data pernah tersimpan di sini (belum pernah selesai dibuat, atau isinya dihapus oleh browser). Kalau memuat ulang tidak membantu, mulai lagi dengan database kosong; punya backup .sabung? Impor sesudahnya.</p>
      <Button variant="danger" className="mt-3" onClick={() => setOpen(true)}>Mulai ulang database…</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Mulai ulang database?"
        message="Database Sabung Idol di browser ini dihapus dan dibuat ulang, lalu data idol bawaan dimuat lagi. Ini tidak bisa dibatalkan."
        confirmLabel="Hapus dan mulai ulang"
        danger
        typeToConfirm="HAPUS"
        onConfirm={() => confirmReset(database)}
      />
    </div>
  );
}
