// Which Career Stats columns are shown (PRD §8 "kolom bisa diatur"): a folded list of checkboxes.
import { CAREER_COLUMNS, type CareerColumn } from "../wiki/careerColumns";

export function ColumnPicker({ shown, onChange, columns = CAREER_COLUMNS }: { shown: string[]; onChange: (ids: string[]) => void; columns?: CareerColumn[] }) {
  return (
    <details className="panel px-3 py-2 text-sm">
      <summary className="cursor-pointer">Columns ({shown.length} of {columns.length})</summary>
      <fieldset className="m-0 mt-2 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1 border-0 p-0">
        <legend className="sr-only">Columns shown</legend>
        {columns.map((c) => (
          <label key={c.id} className="flex items-center gap-2">
            <input type="checkbox" checked={shown.includes(c.id)} onChange={(e) => onChange(e.target.checked ? columns.map((x) => x.id).filter((id) => id === c.id || shown.includes(id)) : shown.filter((id) => id !== c.id))} />
            {c.header}
          </label>
        ))}
      </fieldset>
    </details>
  );
}
