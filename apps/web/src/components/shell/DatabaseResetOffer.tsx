// Shown under the E-DB-001 error when the database has never opened (data/resetOffer.ts):
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
      <p className="m-0 text-sm">Database ini belum pernah berhasil dibuka, jadi belum ada data yang tersimpan di dalamnya. Kalau memuat ulang tidak membantu, mulai lagi dengan database kosong.</p>
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
