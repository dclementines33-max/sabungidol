// Input Data, way 2 (PRD §8): one idol by hand. It goes through the same preview as a paste.
import type { Fields } from "@sabung/shared";
import { Button } from "@sabung/ui";
import type { FormEvent } from "react";

const FIELD = "mt-1 block w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright";

export function IdolForm({ groups, onFields }: { groups: string[]; onFields: (fields: Fields[]) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onFields([Object.fromEntries(new FormData(event.currentTarget)) as Fields]);
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm text-text-secondary">Nama<input name="name" required maxLength={60} className={FIELD} /></label>
      <label className="text-sm text-text-secondary">
        Group (kosong = Soloist)
        <input name="group" list="known-groups" maxLength={60} className={FIELD} />
        <datalist id="known-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
      </label>
      <label className="text-sm text-text-secondary">Rating (kosong = 75)<input name="rating" type="number" min={0} max={100} className={FIELD} /></label>
      <label className="text-sm text-text-secondary">
        Seed
        <select name="seed" className={FIELD} defaultValue="">
          <option value="">—</option>
          {[1, 2, 3, 4].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="text-sm text-text-secondary">Nationality (mis. KR)<input name="nationality" maxLength={2} className={FIELD} /></label>
      <label className="text-sm text-text-secondary">Tanggal lahir<input name="birthday" type="date" className={FIELD} /></label>
      <div className="sm:col-span-2 lg:col-span-3"><Button type="submit">Pratinjau</Button></div>
    </form>
  );
}
