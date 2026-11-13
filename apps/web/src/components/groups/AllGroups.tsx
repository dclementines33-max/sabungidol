// Girl Groups → "Semua grup" (Update 3): every group with its logo, member count and page link, and a form to add a
// new group (its members come later through Input Data, by typing the group's name).
import type { IdolRow } from "@sabung/db";
import { Button } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { CompetitionLogo } from "../CompetitionLogo";

type Group = { id: string; name: string; logoId: string | null };

export function AllGroups({ groups, idols }: { groups: Group[]; idols: IdolRow[] }) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const count = (id: string) => idols.filter((i) => i.groupId === id).length;
  const add = async () => {
    try {
      const id = await engine().addGroup(name);
      if (logo) await engine().setGroupLogo(id, await engine().savePhoto(logo));
      notify({ level: "success", message: `Grup ${name.trim()} ditambahkan` });
      setName("");
      setLogo(null);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (error) {
      notify({ level: "error", code: "E-GROUP-001", message: "Grup tidak tersimpan.", context: error instanceof Error ? error.message : String(error) });
    }
  };
  return (
    <div className="space-y-8">
      <form className="flex flex-wrap items-end gap-3 bg-surface/60 p-4" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <label className="text-sm text-text-secondary">Nama grup baru
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="mt-1 block w-64 border-0 border-b-2 border-border-strong bg-bg-base/60 px-2 py-1 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright" />
        </label>
        <label className="text-sm text-text-secondary">Logo (opsional)
          <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} className="mt-1 block text-xs" />
        </label>
        <Button type="submit" variant="primary" disabled={!name.trim()}>Tambah grup</Button>
      </form>
      <ul aria-label="Semua girl group" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3 p-0">
        {groups.map((g) => (
          <li key={g.id}>
            <Link to="/wiki/group/$id" params={{ id: g.id }} className="flex items-center gap-3 bg-surface/60 p-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
              {g.logoId ? <CompetitionLogo logoId={g.logoId} className="size-10" /> : <span aria-hidden="true" className="flex size-10 items-center justify-center bg-surface-hover font-gothic text-xl text-accent-bright">{g.name[0]}</span>}
              <span className="min-w-0">
                <span className="block truncate font-display">{g.name}</span>
                <span className="block text-xs text-text-secondary">{count(g.id)} member</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
