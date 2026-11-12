// The Idol Database's default view: one photo card per idol (PRD §8).
import { IdolCard } from "@sabung/ui";

export function IdolDatabaseGrid({ ids }: { ids: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-4 p-0" aria-label="Idol">
      {ids.map((id) => <li key={id}><IdolCard idolId={id} /></li>)}
    </ul>
  );
}
