// Season Honours (PRD §8): the Unzure Cup podium, then every champion with a big photo.
import { IdolCard, KahootPodium } from "@sabung/ui";
import { titleLabel } from "./competitionLinks";

type Title = { champion: string; runnerUp: string };
const ORDER = ["DSG", "UZC", "IDL", "IDL-PO", "INK", "NUG"];

export function SeasonHonours({ titles, uzcThird }: { titles: Partial<Record<string, Title>>; uzcThird: string | null }) {
  const keys = Object.keys(titles).sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
  const uzc = titles.UZC;
  return (
    <section className="space-y-8" aria-labelledby="honours">
      <h2 id="honours" className="m-0 font-display text-2xl uppercase">Season Honours</h2>
      {uzc && uzcThird && <KahootPodium title="Unzure Cup" first={uzc.champion} second={uzc.runnerUp} third={uzcThird} />}
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4 p-0">
        {keys.map((key) => (
          <li key={key} className="space-y-2">
            <p className="m-0 text-xs tracking-widest text-text-secondary uppercase">{titleLabel(key)}</p>
            <IdolCard idolId={titles[key]!.champion} />
          </li>
        ))}
      </ul>
    </section>
  );
}
