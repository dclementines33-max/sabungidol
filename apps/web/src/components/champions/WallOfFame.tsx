// Hall of Champions → "most titles" as a poster wall (PRD §8): every champion's card, most titles first,
// with the count as a big gold blackletter number above the card (Update 3: no sticker over the rating).
import { IdolCard } from "@sabung/ui";
import { Link } from "@tanstack/react-router";

export function WallOfFame({ champions }: { champions: string[] }) {
  const counts = [...champions.reduce((m, id) => m.set(id, (m.get(id) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return (
    <section aria-labelledby="most-titles" className="space-y-3">
      <h3 id="most-titles" className="m-0 font-display text-xl uppercase">Most titles</h3>
      <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
        {counts.map(([id, n]) => (
          <li key={id}>
            <p className="m-0 mb-1 flex items-baseline gap-2">
              <span className="font-gothic text-5xl leading-none text-brand-gold">{n}</span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase">gelar</span>
            </p>
            <Link to="/wiki/idols/$id" params={{ id }} className="block rounded-card focus-visible:outline-2 focus-visible:outline-accent-bright"><IdolCard idolId={id} /></Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
