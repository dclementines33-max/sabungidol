// Idol Profile → Overview (PRD §8): badges, titles won, rating history.
import { BADGES } from "@sabung/shared";
import { useBranding } from "../../data/branding";
import { RatingChart } from "./RatingChart";

type Props = {
  badges: { badge: string; season: number }[];
  titles: { comp: string; season: number }[];
  history: { old: number; new: number }[];
  rating: number;
};

const H3 = "m-0 text-xs tracking-widest text-text-secondary uppercase";

export function ProfileOverview({ badges, titles, history, rating }: Props) {
  const { label } = useBranding();
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="badges" className="space-y-2">
        <h3 id="badges" className={H3}>Badge</h3>
        {badges.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {badges.map((b) => <li key={`${b.badge}-${b.season}`} className="rounded-control border border-border-strong px-2 py-1 text-sm">{BADGES[b.badge] ?? b.badge} <span className="text-text-secondary">S{b.season}</span></li>)}
          </ul>
        ) : <p className="m-0 text-sm text-text-secondary">Belum ada badge.</p>}
      </section>
      <section aria-labelledby="titles" className="space-y-2">
        <h3 id="titles" className={H3}>Gelar</h3>
        {titles.length ? (
          <ul className="m-0 list-none space-y-1 p-0 text-sm">
            {titles.map((t) => <li key={`${t.comp}-${t.season}`}><span className="font-mono text-text-secondary">S{t.season}</span> {label(t.comp)}</li>)}
          </ul>
        ) : <p className="m-0 text-sm text-text-secondary">Belum ada gelar.</p>}
      </section>
      <section aria-labelledby="rating-history" className="space-y-2 lg:col-span-2">
        <h3 id="rating-history" className={H3}>Riwayat rating</h3>
        <RatingChart history={history} current={rating} />
      </section>
    </div>
  );
}
