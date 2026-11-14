// Edit buttons on the Idol Profile (Fase 6 step 9): change name / group / nationality / birthday / role (Update 3), replace the photo,
// or go to the Rating Manager (a rating changes there, so it keeps its history).
import type { IdolRow } from "@sabung/db";
import { Button, Modal } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useRef, useState } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { notify } from "../../data/notices";
import { forgetPhoto } from "../../data/photoCache";
import { queryClient } from "../../data/queryClient";
import { FIELD } from "../settings/settingsShared";
import { PhotoFocal } from "./PhotoFocal";

const refresh = () => queryClient.invalidateQueries({ queryKey: IDOLS_QUERY });

export function ProfileEdit({ idol }: { idol: IdolRow }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const result = await engine().updateIdol(idol.id, {
      name: f.name!, groupName: f.group?.trim() || null, rating: idol.rating, seed: idol.seed ?? null,
      nationality: f.nationality?.trim().toUpperCase() || null, birthday: f.birthday || null, role: f.role?.trim() || null,
    }).catch((e: unknown) => ({ ok: false as const, reason: e instanceof Error ? e.message : String(e) }));
    if (!result.ok) { setError(result.reason); return; }
    notify({ level: "success", message: `${f.name} saved` });
    setOpen(false);
    await refresh();
  };
  const replace = async (file: File) => {
    const { old } = await engine().replacePhoto(idol.id, file);
    if (old) forgetPhoto(old);
    notify({ level: "success", message: "Photo replaced" });
    await refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => { setError(null); setOpen(true); }}>Edit profile</Button>
      <Button onClick={() => picker.current?.click()}>Replace photo</Button>
      {idol.photoId && <PhotoFocal idol={{ ...idol, photoId: idol.photoId }} />}
      <input ref={picker} type="file" accept="image/*" hidden aria-label={`New photo for ${idol.name}`} onChange={(e) => { const file = e.target.files?.[0]; if (file) void replace(file); e.target.value = ""; }} />
      <Link to="/studio/ratings" className="inline-flex items-center bg-surface-hover/70 px-3 py-2 text-xs font-bold uppercase [font-stretch:115%] hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">Set rating</Link>
      <Modal open={open} onOpenChange={setOpen} title={`Edit ${idol.name}`} description="Ratings change in the Rating Manager, so the history is kept.">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-text-secondary">Name<input name="name" required maxLength={60} defaultValue={idol.name} className={FIELD} /></label>
          <label className="text-sm text-text-secondary">Group (empty = Soloist)<input name="group" maxLength={60} defaultValue={idol.groupName ?? ""} className={FIELD} /></label>
          <label className="text-sm text-text-secondary">Country (2 letters)<input name="nationality" maxLength={2} defaultValue={idol.nationality ?? ""} className={FIELD} /></label>
          <label className="text-sm text-text-secondary">Birthday<input name="birthday" type="date" defaultValue={idol.birthday ?? ""} className={FIELD} /></label>
          <label className="text-sm text-text-secondary sm:col-span-2">Role in the group (e.g. Leader, Main Vocalist)<input name="role" maxLength={80} defaultValue={idol.role ?? ""} className={FIELD} /></label>
          {error && <p role="alert" className="m-0 text-sm text-danger sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
