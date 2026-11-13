// Idol Profile hero (PRD §8; design/refs mood: one big photo, a huge capital headline, stat bubbles):
// photo, group, NAME, rating and tier, league, nationality, age, and the button to compare in Head to Head.
import type { IdolRow } from "@sabung/db";
import { tierOf } from "@sabung/shared";
import { IdolPhoto, RatingBadge, StatTile } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";

const age = (birthday: string | null) => (birthday ? Math.floor((Date.now() - Date.parse(birthday)) / 31_557_600_000) : null);

export function ProfileHero({ idol, league, titles, matches, winRate }: { idol: IdolRow; league?: string; titles: number; matches: number; winRate: number }) {
  const years = age(idol.birthday);
  const facts = [league ? `Liga ${league}` : "Cadangan", idol.nationality, years !== null ? `${years} tahun` : null, idol.active ? null : "Nonaktif"].filter(Boolean);
  return (
    <section className="flex flex-col gap-6 sm:flex-row sm:items-end" aria-labelledby="idol-name">
      <IdolPhoto idolId={idol.id} size={1024} className="w-48 shrink-0 sm:w-64" />
      <div className="min-w-0 flex-1 space-y-4">
        <div>
          <p className="m-0 text-xs tracking-widest text-text-secondary uppercase">{idol.groupName ?? "Soloist"}</p>
          <h2 id="idol-name" className="m-0 font-display text-2xl leading-none font-bold break-words uppercase sm:text-3xl">{idol.name}</h2>
        </div>
        <p className="m-0 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <RatingBadge rating={idol.rating} /> <span>Tier {tierOf(idol.rating)}</span>
          {facts.map((f) => <span key={f}>· {f}</span>)}
        </p>
        <div className="grid max-w-xl grid-cols-3 gap-3">
          <StatTile label="Gelar" value={titles} />
          <StatTile label="Match" value={matches} />
          <StatTile label="Win rate" value={`${Math.round(winRate * 100)}%`} />
        </div>
        <Link to="/wiki/h2h" search={{ a: idol.id }} className="inline-flex items-center gap-2 rounded-control border border-border-strong px-3 py-2 text-sm hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
          <GitCompareArrows aria-hidden="true" size={16} /> Bandingkan (Head to Head)
        </Link>
      </div>
    </section>
  );
}
