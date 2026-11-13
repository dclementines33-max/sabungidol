// The Idol Database's default view: one photo card per idol (PRD §8), each a link to the idol's profile.
import { IdolCard } from "@sabung/ui";
import { Link } from "@tanstack/react-router";

export function IdolDatabaseGrid({ ids }: { ids: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-4 p-0" aria-label="Idol">
      {ids.map((id) => <li key={id}><Link to="/wiki/idols/$id" params={{ id }} className="block rounded-card focus-visible:outline-2 focus-visible:outline-accent-bright">{<IdolCard idolId={id} />}</Link></li>)}
    </ul>
  );
}
