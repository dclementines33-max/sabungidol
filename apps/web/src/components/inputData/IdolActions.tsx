// Input Data, per idol (PRD §8): replace photo, active on/off, delete (with confirmation; refused
// with the reason when the idol has matches or is in a league roster), open the profile.
import type { IdolRow } from "@sabung/db";
import { Button, ConfirmDialog, IdolPhoto, RatingBadge, VirtualTable } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { forgetPhoto } from "../../data/photoCache";
import { queryClient } from "../../data/queryClient";

type Target = { idol: IdolRow; blocker: { matches: number; roster?: string } | null };
const refresh = () => queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });

export function IdolActions({ idols }: { idols: IdolRow[] }) {
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const photoFor = useRef<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const shown = useMemo(() => idols.filter((i) => `${i.name} ${i.groupName ?? "soloist"}`.toLowerCase().includes(search.trim().toLowerCase())), [idols, search]);

  const toggle = async (idol: IdolRow) => {
    await engine().setActive([idol.id], !idol.active);
    await refresh();
  };
  const replace = async (file: File) => {
    const idolId = photoFor.current!;
    const { old } = await engine().replacePhoto(idolId, file);
    if (old) forgetPhoto(old);
    notify({ level: "success", message: "Foto diganti" });
    await refresh();
  };
  const remove = async (idol: IdolRow) => {
    const result = await engine().deleteIdol(idol.id);
    if (result.deleted) notify({ level: "success", message: `${idol.name} dihapus` });
    else notify({ level: "warning", message: `${idol.name} tidak dihapus: ${result.roster ? `ada di roster ${result.roster}` : `sudah punya ${result.matches} match`}` });
    await refresh();
  };

  const why = target?.blocker && (target.blocker.roster
    ? `Ada di roster ${target.blocker.roster}. Ganti dulu di Settings → Roster liga, atau nonaktifkan.`
    : `Sudah punya ${target.blocker.matches} match, jadi bagian dari sejarah. Nonaktifkan saja: tetap tercatat, tapi tidak ikut season berikutnya.`);

  return (
    <section className="space-y-4" aria-labelledby="manage">
      <h2 id="manage" className="m-0 font-display text-lg">Kelola idol</h2>
      <label className="block max-w-sm text-sm text-text-secondary">
        Cari
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nama atau group…"
          className="mt-1 block w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright" />
      </label>
      <VirtualTable
        rows={shown}
        rowKey={(i) => i.id}
        label="Kelola idol"
        rowHeight={56}
        height="60vh"
        columns={[
          { header: "Foto", cell: (i) => <IdolPhoto idolId={i.id} size={64} className="w-8" />, className: "w-14" },
          { header: "Nama", cell: (i) => <><span className="font-medium">{i.name}</span><span className="block text-xs text-text-secondary">{i.groupName ?? "Soloist"}</span></> },
          { header: "Rating", cell: (i) => <RatingBadge rating={i.rating} /> },
          { header: "Aktif", cell: (i) => (
            <input type="checkbox" checked={i.active} onChange={() => toggle(i)} aria-label={`${i.name} aktif`} className="size-4 accent-accent-bright" />
          ) },
          { header: "Aksi", cell: (i) => (
            <div className="flex flex-wrap gap-1">
              <Button className="px-2 py-1" onClick={() => { photoFor.current = i.id; picker.current?.click(); }}>Ganti foto</Button>
              <Link to="/wiki/idols/$id" params={{ id: i.id }} className="rounded-control px-2 py-1 text-sm text-accent-bright underline underline-offset-4">Profil</Link>
              <Button variant="danger" className="px-2 py-1" onClick={async () => setTarget({ idol: i, blocker: await engine().deleteBlocker(i.id) })}>Hapus</Button>
            </div>
          ) },
        ]}
      />
      <input ref={picker} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) replace(e.target.files[0]); e.target.value = ""; }} />
      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target?.blocker ? `${target.idol.name} tidak bisa dihapus` : `Hapus ${target?.idol.name ?? ""}?`}
        message={why || "Idol ini dan fotonya dihapus. Ini tidak bisa dibatalkan."}
        confirmLabel={target?.blocker ? "Nonaktifkan" : "Hapus"}
        danger={!target?.blocker}
        onConfirm={() => target && (target.blocker ? (target.idol.active ? toggle(target.idol) : undefined) : remove(target.idol))}
      />
    </section>
  );
}
