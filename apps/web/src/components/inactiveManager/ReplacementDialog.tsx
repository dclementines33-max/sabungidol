// Deactivating idols that hold a league place (PRD §8): each gets a replacement from the reserves,
// suggested automatically and changeable by hand. Without one, the place keeps an inactive idol.
import { Button, Modal, SearchableIdolSelect, useIdolLookup } from "@sabung/ui";
import { useRef } from "react";

export type Replacement = { id: string; comp: string; suggestion: string | null };

export function ReplacementDialog({ rows, reserves, onChange, onCancel, onConfirm }: {
  rows: Replacement[];
  reserves: string[];
  onChange: (id: string, replacement: string | null) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const lookup = useIdolLookup();
  const cancel = useRef<HTMLButtonElement>(null);
  const chosen = new Set(rows.map((r) => r.suggestion));
  return (
    <Modal
      open={rows.length > 0}
      onOpenChange={(open) => !open && onCancel()}
      title="Pilih pengganti di roster"
      description="Idol ini punya tempat di liga season sekarang. Penggantinya diambil dari cadangan (idol aktif tanpa tempat)."
      onOpenAutoFocus={(event) => { event.preventDefault(); cancel.current?.focus(); }} // like ConfirmDialog: a picker would open over the buttons
      footer={<><Button ref={cancel} onClick={onCancel}>Batal</Button><Button variant="primary" onClick={onConfirm}>Nonaktifkan</Button></>}
    >
      <ul className="m-0 list-none space-y-3 p-0">
        {rows.map((r) => (
          <li key={r.id}>
            <p className="m-0 text-sm"><span className="font-medium">{lookup(r.id)?.name}</span> <span className="font-mono text-text-secondary">({r.comp})</span></p>
            <SearchableIdolSelect label={`Pengganti untuk ${lookup(r.id)?.name}`} idolIds={reserves.filter((id) => id === r.suggestion || !chosen.has(id))}
              value={r.suggestion} onChange={(id) => onChange(r.id, id)} />
            {!r.suggestion && <p className="m-0 mt-1 text-sm text-accent-bright">Tanpa pengganti: tempat ini tetap berisi idol nonaktif.</p>}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
