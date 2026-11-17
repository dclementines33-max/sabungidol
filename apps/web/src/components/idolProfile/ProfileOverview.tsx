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

const H3 = "section-title text-lg";

export function ProfileOverview({ badges, titles, awards = [], history, rating, mood }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {mood && (
        <section aria-labelledby="mood" className="space-y-2 lg:col-span-2">
          <h3 id="mood" className={H3}>This season · right now</h3>
          <dl className="m-0 grid gap-3 sm:grid-cols-2">
            <div className="panel p-4"><dt className="kicker text-text-secondary">Form</dt><dd className="m-0 mt-1 font-display text-section uppercase">{mood.form} <span className="font-mono text-sm text-text-secondary">{mood.last.join(" ")}</span></dd></div>
            <div className="panel p-4"><dt className="kicker text-text-secondary">Morale</dt><dd className="m-0 mt-1 font-display text-section uppercase">{mood.moraleName} <span className="font-mono text-sm text-text-secondary">{mood.morale > 0 ? "+" : ""}{mood.morale} / ±10</span></dd></div>
          </dl>
        </section>
      )}
      <section aria-labelledby="badges" className="space-y-2">
        <h3 id="badges" className={H3}>Badge</h3>
        {badges.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {badges.map((b) => <li key={`${b.badge}-${b.season}`} className="chip bg-stage-hi text-text-primary shadow-[inset_0_-2px_0_var(--color-winner)]"><span>{BADGES[b.badge] ?? b.badge} <span className="text-text-secondary">S{b.season}</span></span></li>)}
          </ul>
        ) : <p className="m-0 text-sm text-text-secondary">No badges yet.</p>}
      </section>
      <section aria-labelledby="titles" className="space-y-2 lg:col-span-2">
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
