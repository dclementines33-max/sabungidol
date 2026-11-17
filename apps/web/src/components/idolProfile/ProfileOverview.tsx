// Idol Profile → Overview (PRD §8): form and morale right now, badges, the trophy cabinet (PRD §16), the award cabinet, rating history.
import { BADGES } from "@sabung/shared";
import { AwardCabinet } from "./AwardCabinet";
import { RatingChart } from "./RatingChart";
import { TrophyCabinet } from "./TrophyCabinet";

type Props = {
  badges: { badge: string; season: number }[];
  titles: { comp: string; season: number }[];
  awards?: { key: string; season: number }[];
  history: { old: number; new: number }[];
  rating: number;
  mood?: { form: string; morale: number; moraleName: string; last: string[] } | null;
};

const H3 = "m-0 text-xs tracking-widest text-text-secondary uppercase";

export function ProfileOverview({ badges, titles, awards = [], history, rating, mood }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {mood && (
        <section aria-labelledby="mood" className="space-y-2 lg:col-span-2">
          <h3 id="mood" className={H3}>This season · right now</h3>
          <dl className="m-0 flex flex-wrap gap-x-10 gap-y-2">
            <div><dt className="text-xs text-text-secondary">Form</dt><dd className="m-0 font-display text-xl uppercase">{mood.form} <span className="font-mono text-sm text-text-secondary">{mood.last.join(" ")}</span></dd></div>
            <div><dt className="text-xs text-text-secondary">Morale</dt><dd className="m-0 font-display text-xl uppercase">{mood.moraleName} <span className="font-mono text-sm text-text-secondary">{mood.morale > 0 ? "+" : ""}{mood.morale} / ±10</span></dd></div>
          </dl>
        </section>
      )}
      <section aria-labelledby="badges" className="space-y-2">
        <h3 id="badges" className={H3}>Badge</h3>
        {badges.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {badges.map((b) => <li key={`${b.badge}-${b.season}`} className="rounded-control bg-surface-hover/60 px-2 py-1 text-sm">{BADGES[b.badge] ?? b.badge} <span className="text-text-secondary">S{b.season}</span></li>)}
          </ul>
        ) : <p className="m-0 text-sm text-text-secondary">No badges yet.</p>}
      </section>
      <section aria-labelledby="titles" className="space-y-2">
        <h3 id="titles" className={H3}>Trophy cabinet</h3>
        <TrophyCabinet titles={titles} />
      </section>
      <section aria-labelledby="award-cabinet" className="space-y-2 lg:col-span-2">
        <h3 id="award-cabinet" className={H3}>Award cabinet</h3>
        <AwardCabinet awards={awards} />
      </section>
      <section aria-labelledby="rating-history" className="space-y-2 lg:col-span-2">
        <h3 id="rating-history" className={H3}>Rating history</h3>
        <RatingChart history={history} current={rating} />
      </section>
    </div>
  );
}
